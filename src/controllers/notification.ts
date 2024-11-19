import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'

export const welcome_notification = async(req: Request, res: Response)=>{
    try {
        
        // send email to user

        return res.status(201).json({msg: 'User created successfully.'})

    } catch (err:any) {
        console.log('Error sending welcome notification ', err);
        return res.status(500).json({err:'Error sending welcome notification ', error: err});
    }
}