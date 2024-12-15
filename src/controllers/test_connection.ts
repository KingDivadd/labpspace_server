import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { redis_url } from '../helpers/constants'

export const test_basic_connection = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        return res.status(200).json({msg: 'Labspace Server still connected...'})
    } catch (err:any) {
        console.log('Error occured in test basic server connection controller ', err)
        return res.status(500).json({err: 'Error occured in test basic server connection controller ', error: err})
        
    }
}

export const test_db_connection = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const [user, admin] = await Promise.all([
            prisma.user.findMany({ orderBy: {created_at: 'desc'}}), 
            prisma.user.findMany({where: {is_admin: true}, orderBy: {created_at: 'desc'}})
        ])

        return res.status(200).json({
            msg: 'Labspace db access still connected.',
            total_no_of_users: user.length,
            total_no_of_admin: admin.length,
            users: user
        })
    } catch (err:any) {
        console.log('Error occured in test db connection controller ', err)
        return res.status(500).json({err: 'Error occured in test db connection controller ', error: err})
    }
}