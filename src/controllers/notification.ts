import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from '../helpers/interface';
import converted_datetime from '../helpers/date_time_elements';


export const welcome_notification_2 = async(req: Request, res: Response)=>{
    try {
        
        // send email to admin welcoming them to labspace

        return res.status(201).json({msg: 'User registered successfully.'})

    } catch (err:any) {
        console.log('Error sending welcome notification ', err);
        return res.status(500).json({err:'Error sending welcome notification ', error: err});
    }
}

export const unread_user_notification = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.account_holder.user.user_id

        const notification = await prisma.notificationAssignment.findMany({
            where: {
                user_id, 
                is_read: false
            },
            include: {
                notification: {
                    include: {task: true, team: true, }
                }
            },
            orderBy: {created_at: 'desc'}
        })

        return res.status(200).json({number_of_unread_notification: notification.length, unread_notifications: notification})


    } catch (err:any) {
        console.log('Error fetching user unread notification ', err);
        return res.status(500).json({err:'Error fetching user unread notification ', error:err});
    }
}

export const paginated_user_notification = async (req:CustomRequest, res: Response) => {
    try {
        const user_id = req.account_holder.user.user_id

        const {list_number, page_number} = req.params

        const no_of_items_per_table = Number(list_number) || 15

        const [number_of_notifications, notifications ] = await Promise.all([

            prisma.notificationAssignment.count({ where: {user_id} }),

            prisma.notificationAssignment.findMany({
                where: {
                    user_id, 
                },
                include: {
                    notification: {
                        include: {
                            task: {
                                include:{
                                    team:{
                                        include:{
                                            user:{
                                                select:{first_name:true,last_name:true,email:true,avatar:true,title:true, is_active:true}
                                            }
                                        }
                                    }
                                }
                            } 
                        }
                    }
                },
                skip: (Math.abs(Number(page_number)) - 1) * no_of_items_per_table, take: no_of_items_per_table, orderBy: { created_at: 'desc'  } 
            }),

        ])
        
        const number_of_notification_pages = (number_of_notifications <= no_of_items_per_table) ? 1 : Math.ceil(number_of_notifications / no_of_items_per_table)

        return res.status(200).json({ 
            total_number_of_notifications: number_of_notifications, 
            total_number_of_pages: number_of_notification_pages, 
            notifications 
        })

    } catch (err:any) {
        console.log('Error fetching user notification ', err);
        return res.status(500).json({err:'Error fetching user notification ', error:err});
    }
}

export const read_notification = async(req: CustomRequest, res: Response)=>{
    try {
        
        const user_id = req.account_holder.user.user_id
        
        const {notificationAssignment_id} = req.params

        const update_notification_status = await prisma.notificationAssignment.update({
            where: {notificationAssignment_id},
            data: {
                is_read: true,
                updated_at: converted_datetime()
            },
            
        })

        return res.status(200).json({
            msg: 'notification read'

        })

    } catch (err:any) {
        console.log('Error updating notification status to read', err);
        return res.status(500).json({err:'Error updating notification status to read', error: err});
        
    }
}