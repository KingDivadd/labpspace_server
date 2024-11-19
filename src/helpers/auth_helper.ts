import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from './interface'
import { getFromRedis } from './redis_initializer'
import { jwt_secret } from './constants'
const jwt = require('jsonwebtoken')

export const email_exist = async(req: Request, res: Response, next: NextFunction)=>{
    const {email, business_name} = req.body
    try {
        const [user, buz_name] = await Promise.all([
            prisma.user.findUnique({where: {email}}),
            prisma.user.findFirst({where: {
            business_name: {
            equals: business_name, mode: 'insensitive', }
            }})
        ]) 

        if (user ){
            return res.status(409).json({ err: 'email already registered to another user' })
        }

        if(buz_name){ return res.status(409).json({err: 'Business name already taken!'}) }

        return next()

    } catch (err:any) {
        console.log('Error occured while checking if email exist ', err)
        return res.status(500).json({err: 'Error occured while checking if email exist ', error: err})
        
    }
}

export const verify_otp_status = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const {email} = req.body
    try {


        const value: any = await getFromRedis(`${email}`)
        if (!value){
            return res.status(401).json({err: "OTP session id has expired, generate a new OTP and re verify..."})
        }
        const otp_data = await jwt.verify(value, jwt_secret)
        req.otp_data = otp_data
        req.user_email = otp_data.email

        return next()
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(410).json({ err: `jwt token expired, generate and verify OTP`, error:err })
        }

        console.log('Error in verify otp status funciton', err)
        return res.status(500).json({ err: 'Error in verify otp status function ', error:err })
    }
}

export const socket_verify_auth_id = async (auth_id: string): Promise<{ statusCode: number; data?: any; message?: string }> => {
    try {
        if (!auth_id) { return { statusCode: 401, message: 'x-id-key is missing' }; }

        const value = await getFromRedis(`${auth_id}`)

        if (!value) {  return { statusCode: 404, message: 'Auth session id expired. Please generate OTP.' }; }

        const decode_value = await jwt.verify(value, jwt_secret)
        
        const user_id = decode_value.user.user_id || null
        const physician_id =decode_value.user.physician_id || null
        
        if (user_id == null && physician_id == null){
            return {statusCode: 401, message: 'Please enter the correct x-id-key'}
        }
        
        return { statusCode: 200, data: decode_value.user }

    } catch (err: any) {
        console.error(err);
        return { statusCode: 500, message: `err: ${err}`, };
    }
}

export const verify_auth_id = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const auth_id = req.headers['x-id-key'];
        if (!auth_id) {
            return res.status(401).json({ err: 'x-id-key is missing' })
        }
        
        const value = await getFromRedis(`${auth_id}`)
        
        if (!value) {
            return res.status(401).json({ err: `auth session id expired, please generate otp`})
        }        
        
        const decode_value = await jwt.verify(value, jwt_secret)        
        
        const user_id = decode_value.user.user_id || null
        const physician_id =decode_value.user.physician_id || null
        
        if (user_id == null && physician_id == null){
            return res.status(401).json({err: 'Please enter the correct x-id-key'})
        }
        
        req.account_holder = decode_value
        return next()
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(410).json({ err: `jwt token expired, regenerate OTP` })
        }
        console.error('Error in verify auth id function : ', err)
    }
}


export const check_user_availability = async (user_id:any) => {
    try {
        if (!user_id) { return {statusCode: 400, message: "user id not provided to check current availability"}  }


        const value = await getFromRedis(`${user_id}`)

        if (!value) { return ({statusCode: 200, message: "the user you are trying to call is available..."}) }
        
        const decoded_value = await jwt.verify(value, jwt_secret)

        if (!decoded_value.availability.is_avialable && !decoded_value.availability.users.includes(user_id)){
            return {statusCode: 409, message: "The user you are trying to call is currently not available", value: decoded_value}
        }

        return {statusCode: 200, message: "The user you are trying to reach is available", value: decoded_value}
        
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return {statusCode: 410, message: 'jwt token expired, generate regenerate OTP'}
        }
    }
}