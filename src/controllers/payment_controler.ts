import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import converted_datetime from '../helpers/date_time_elements'
import { admin_account_created_mail, password_reset_otp_mail, password_reset_success_mail} from '../helpers/emails'
import { CustomRequest } from '../helpers/interface'

export const all_paginated_payments = async(req: CustomRequest, res: Response)=>{
    try {

        const {list_number, page_number} = req.params

        const no_of_items_per_table = Number(list_number) || 15

        const [number_of_payments, payments, task ] = await Promise.all([

            prisma.paymentHistory.count({ }),

            prisma.paymentHistory.findMany({
                include:{
                    added_by: {select: {first_name: true, last_name: true, avatar: true, is_admin: true, is_active: true}},
                    project: true
                },
                skip: (Math.abs(Number(page_number)) - 1) * no_of_items_per_table, 
                take: no_of_items_per_table, 
                orderBy: { created_at: 'desc'  } 
            }),

            prisma.project.findMany({
                select:{cost: true, project_title: true, project_ind: true, project_id:true},
                orderBy:{created_at:'desc'}
            })

        ])
        
        const number_of_payment_pages = (number_of_payments <= no_of_items_per_table) ? 1 : Math.ceil(number_of_payments / no_of_items_per_table)

        return res.status(200).json({ 
            total_number_of_payments: number_of_payments, 
            total_number_of_pages: number_of_payment_pages, 
            payments, task_list:task })

    } catch (err:any) {
        console.log('Error occured while fetching all payments ',err);
        return res.status(500).json({err:'Error occured while fetching all payments ',error:err});
    }
}

export const add_new_payment = async (req:CustomRequest, res: Response, ) => {
    const {task_id, amount, payer_name, payment_receipt, } = req.body
    try {
        const user_id = req.account_holder.user.user_id

        req.body.added_by_id = user_id
        req.body.created_at = converted_datetime()
        req.body.updated_at = converted_datetime()

        const [new_payment, admins] = await Promise.all([
            prisma.paymentHistory.create({ data: req.body }),
            prisma.user.findMany({ where: {is_admin: true} })
        ])  

        if (new_payment && admins.length) {

            const new_notification = await prisma.notification.create({
                data: {
                    status: 'completed',
                    notification_type: 'payment',
                    notification_sub_type: 'payment_created',
                    payment_id: new_payment.payment_id,
                    created_at: converted_datetime(), updated_at: converted_datetime()
                }
            })
                
            const notificationAssignment = admins.map((admin_id: any)=>({
                notification_id: new_notification.notification_id,
                user_id: admin_id,
                created_at: converted_datetime(), updated_at: converted_datetime(),
            }))

            return res.status(201).json({msg: 'New payment added'})
        }
        
    } catch (err:any) {
        console.log('Error occured while adding a new payment ', err);
        return res.status(500).json({err:'Error occured while adding a new payment ', error:err});
    }
}

export const edit_payment = async (req:CustomRequest, res: Response, ) => {
    const {task_id, amount, payer_name, payment_receipt, } = req.body
    try {
        const user_id = req.account_holder.user.user_id

        const {payment_id} = req.params
        const update:any = {}

        req.body.added_by_id = user_id
        req.body.created_at = converted_datetime()
        req.body.updated_at = converted_datetime()

        const [new_payment, admins] = await Promise.all([
            prisma.paymentHistory.update({ where: {payment_id}, data: req.body }),
            prisma.user.findMany({ where: {is_admin: true} })
        ])  

        if (new_payment && admins.length) {

            const new_notification = await prisma.notification.create({
                data: {
                    status: 'completed',
                    notification_type: 'payment',
                    notification_sub_type: 'payment_updated',
                    payment_id: payment_id,
                    created_at: converted_datetime(), updated_at: converted_datetime()
                }
            })
                
            const notificationAssignment = admins.map((admin_id: any)=>({
                notification_id: new_notification.notification_id,
                user_id: admin_id,
                created_at: converted_datetime(), updated_at: converted_datetime(),
            }))

            return res.status(201).json({msg: 'Payment updated'})
        }
        
    } catch (err:any) {
        console.log('Error occured while updating payments', err);
        return res.status(500).json({err:'Error occured while updating payments', error:err});
    }
}
