import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { salt_round } from '../helpers/constants'
import converted_datetime from '../helpers/date_time_elements'
import { redis_auth_store, redis_otp_store, redis_value_update } from '../helpers/redis_funtions'
import {generate_otp, generate_referral_code} from '../helpers/generated_entities'
import { send_mail_otp} from '../helpers/emails'
import { CustomRequest } from '../helpers/interface'
import {send_sms_otp} from '../helpers/sms_funtions'
import { handle_decrypt } from '../helpers/encryption_decryption'
import { physician_consultation_validation } from '../validations'
const bcrypt = require('bcrypt')

export const signup = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const encrypted_password = await bcrypt.hash(req.body.password, salt_round);

        req.body.password = encrypted_password;
        req.body.created_at = converted_datetime();
        req.body.updated_at = converted_datetime();

        const new_user = await prisma.user.create({
            data: req.body
        })

        const x_id_key = await redis_auth_store(new_user, 60 * 60 * 24)
        if (x_id_key){
            res.setHeader('x-id-key', x_id_key)
        }

        
        return next()        

    } catch (err:any) {
        console.log('Error occured during signup ', err);
        return res.status(500).json({err:'Error occured during signup ', error:err});
    }
}


export const login = async(req: Request, res: Response, next: NextFunction)=>{
    const {email, password} = req.body
    try {
        
        const user:any = await prisma.user.findUnique({ where: { email: req.body.email }})

        if (!user){
            console.log('Incorrect email address')
            return res.status(404).json({err: 'user not found, check email and try again'})
        }


        const encrypted_password = user.password
        const match_password: boolean = await bcrypt.compare(password, encrypted_password)

        if (!match_password) {
            console.log('Incorrect password')
            return res.status(401).json({ err: `Incorrect password entered!` })
        }

        const new_auth_id = await redis_auth_store(user, 60 * 60 * 24 * 365); 
        if (new_auth_id){ res.setHeader('x-id-key', new_auth_id) } 
        
        return res.status(200).json({ msg: "Login successful", user_data: user })
        
    } catch (err:any) {
        console.log('Error occured during login ', err);
        return res.status(500).json({err: 'Error occured during login ', error: err})
    }
}

export const patient_signup = async(req: Request, res: Response, next: NextFunction)=>{
    
    try {
        const encrypted_password = await bcrypt.hash(req.body.password, salt_round);

        req.body.password = encrypted_password
        req.body.created_at = converted_datetime()
        req.body.updated_at = converted_datetime()
        req.body.referral_code = generate_referral_code()
        
        const user = await prisma.user.create({ data: req.body })

        const x_id_key = await redis_auth_store(user, 60 * 60 * 23)
        if (x_id_key){
            res.setHeader('x-id-key', x_id_key)
        }
        
        return res.status(201).json({msg: 'User created successfully, proceed to setting up your profile.'})
    } catch (err:any) {
        console.log('Error during patient signup ',err)
        return res.status(500).json({err: 'Error during patient signup ', error: err})
        
    }
}