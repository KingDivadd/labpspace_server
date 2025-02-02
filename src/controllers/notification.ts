import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from '../helpers/interface';
import converted_datetime from '../helpers/date_time_elements';
import webpush from 'web-push'
import { user_account_created_mail } from '../helpers/emails';

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
                    include: {project: true, team: true, }
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
                            project: {
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


export const save_subscription = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { subscription } = req.body;

    try {
        const user_id = req.account_holder.user.user_id

        const save_subscription = await prisma.user.update({
            where:{user_id},
            data: {
                subscription,
                updated_at: converted_datetime(),
            },
        })

        console.log('new sub ', subscription)
            
        return res.status(201).json({ msg: 'New subscription added' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return res.status(500).json({ error: 'Error saving subscription' });
    }
};

export const push_notification = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const {url} = req.body
    try {
        
        if (!url || url == ''){
            req.body.url = '/'
        }

        // const { title, body, avatar, message, data, user_id, } = req.pushNotificationData;

        const title = req.notification_data.title; 
        const body = req.notification_data.body; 
        const avatar = ''; 
        const user_id = req.notification_data.user_id

        const payloadData = { title, body, icon: avatar, url: req.body.url };

        // Send web push notification separately
        const user_subscription = await prisma.user.findUnique({
            where: { user_id}, 
            select: {subscription:true}
        });

        if (user_subscription) {
            const payload = JSON.stringify(payloadData);
            try {
                await webpush.sendNotification(JSON.parse(user_subscription.subscription), payload);
                console.log('Web push notification sent successfully');
            } catch (err) {
                console.error('Error sending web push notification:', err);
            }
        } else {
            console.warn('Receiver\'s subscription was not found.');
        }

        // Send the response after attempting to send notifications
        return res.status(200).json({ msg: req.notification_data.msg  });

        
    } catch (err: any) {
        console.log('Error occurred during sending of web push notification, error:', err);
        return res.status(500).json({ err: 'Error occurred during sending of web push notification', error: err });
    }
};
