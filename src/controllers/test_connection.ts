import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { redis_url } from '../helpers/constants'

export const test_basic_connection = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        return res.status(200).json({msg: 'EaseCredit Server still connected...'})
    } catch (err:any) {
        console.log('Error occured in test basic server connection controller ', err)
        return res.status(500).json({err: 'Error occured in test basic server connection controller ', error: err})
        
    }
}

export const test_db_connection = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        // const [user, admin] = await Promise.all([
        //     prisma.User.findMany({orderBy: {created_at: 'desc'}}), 
        //     prisma.User.findMany({orderBy: {created_at: 'desc'}})
        // ])

        // return res.status(200).json({
        //     msg: 'EaseCredit db access still connected.',
        //     no_of_users: user.length,
        //     no_of_admin: admin.length
        // })
    } catch (err:any) {
        console.log('Error occured in test db connection controller ', err)
        return res.status(500).json({err: 'Error occured in test db connection controller ', error: err})
    }
}