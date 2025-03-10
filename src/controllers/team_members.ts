import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { salt_round } from '../helpers/constants'
import converted_datetime from '../helpers/date_time_elements'
import { redis_auth_delete, redis_auth_store, redis_otp_store, redis_value_update } from '../helpers/redis_funtions'
import {generate_otp, generate_password, generate_referral_code} from '../helpers/generated_entities'
import { account_reinstatement_mail, account_suspension_mail, admin_account_created_mail, admin_priviledge_reinstatemnt_mail, admin_priviledge_removal_mail, password_reset_otp_mail, password_reset_success_mail, user_account_created_mail} from '../helpers/emails'
import { CustomRequest } from '../helpers/interface'
import {send_sms_otp} from '../helpers/sms_funtions'
import { handle_decrypt } from '../helpers/encryption_decryption'
const bcrypt = require('bcrypt')

export const admin_dashboard = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.account_holder.user.user_id;    const is_admin = req.account_holder.user.is_admin

        const page_number = 1

        const no_of_items_per_table = 15

        const projectWhereClause = is_admin
            ? { is_trashed: false } // Admins see all non-trashed projects
            : { 
                is_trashed: false, 
                team: { some: { user_id } } // Non-admins see only projects in their team
            };

        const [total_project, recent_projects ] = await Promise.all([
            prisma.project.findMany({
                where: projectWhereClause,
                select: {
                    project_id: true, stage:true, cost: true, payments:{select: {amount: true}}
                }
            }),

            prisma.project.findMany({
                where: projectWhereClause,
                include: {
                    activities: {
                        include: {
                            created_by: {
                                select: {
                                    first_name: true,
                                    last_name: true,
                                    email: true,
                                    avatar: true,
                                    title: true,
                                    is_active: true,
                                    is_admin: true,
                                    user_id: true,
                                },
                            },
                        },
                    },
                    tasks: true,
                    team: {
                        include: {
                            user: {
                                select: {
                                    first_name: true,
                                    last_name: true,
                                    email: true,
                                    avatar: true,
                                    title: true,
                                    is_active: true,
                                    is_admin: true,
                                    user_id: true,
                                },
                            },
                        },
                    },
                    project_creator: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                            title: true,
                            is_active: true,
                            is_admin: true,
                            user_id: true,
                        },
                    },
                    payments: {
                        select: { amount: true },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip: (Math.abs(Number(page_number)) - 1) * no_of_items_per_table,
                take: no_of_items_per_table, // Ensure pagination limit is applied
            }),

        ])
        
        const assigned_project = total_project.filter((project: any) => project.team 
        && project.team.some((assignment: any) => assignment.user_id === user_id));
        
        console.log(assigned_project)

        const total_project_no = total_project.length
        
        const pending_project = total_project.filter((data:any) => data.stage == 'in_progress' ).length

        // Total Project Due
        // Pending Project
        // Total Project
        // Amount Paid
        // Amount Due

        const project_money = recent_projects.map((project) => {
            const totalPayments = project.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const amount_due = project.cost - totalPayments; // Assuming `cost` is a field in the project model
            return {project_cost:project.cost, amount_paid: totalPayments, amount_due };
        })

        const project_money_store = project_money.reduce((acc, current) => {
            acc.total_project_cost += current.project_cost;
            acc.total_amount_paid += current.amount_paid;
            acc.total_amount_due += current.amount_due;
            return acc;
        }, {
        total_project_cost: 0,
        total_amount_paid: 0,
        total_amount_due: 0
        });

        const projectsWithAmountDue = recent_projects.map((project) => {
            const totalPayments = project.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const amount_due = project.cost - totalPayments; // Assuming `cost` is a field in the project model
            return { ...project, total_amount_paid: totalPayments, amount_due }; // Add `amount_due` field to the project object
        })

        return res.status(200).json({ 
            total_project_due: pending_project,
            pending_project: pending_project,
            total_project: total_project_no,
            total_amount_paid: project_money_store.total_amount_paid,
            total_amount_due: project_money_store.total_amount_due,
            total_project_cost: project_money_store.total_project_cost,
            total_no_of_assigned_projects: assigned_project.length,            
            recent_projects: projectsWithAmountDue,            
        })

    } catch (err:any) {
        console.log('Error occured while fetching all users ',err);
        return res.status(500).json({err:'Error occured while fetching all users ',error:err});
    }
}

export const add_new_member = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const is_admin = req.account_holder.user.is_admin

        if (!is_admin) { return res.status(401).json({err: 'Unauthorized to perform operation'}) }

        const generated_password = generate_password()

        const encrypted_password = await bcrypt.hash(generated_password, salt_round);
        
        req.body.password = encrypted_password;
        req.body.created_at = converted_datetime();
        req.body.updated_at = converted_datetime();

        const new_user = await prisma.user.create({ data: req.body })

        const x_id_key = await redis_auth_store(new_user, 60 * 60 * 24)
        if (x_id_key){
            res.setHeader('x-id-key', x_id_key)
        }

        user_account_created_mail(new_user, generated_password)

        return res.status(201).json({msg: 'User added successfully', user: new_user})        

    } catch (err:any) {
        console.log('Error occured during user addition ', err);
        return res.status(500).json({err:'Error occured during user addition ', error:err});
    }
}

export const edit_member = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {first_name, last_name, email, title, is_admin, is_active} = req.body
    // 1. admin can edit every account but not superadmin's
    // 2. superadmin can edit every account
    try {
        const logged_in_user_id = req.account_holder.user.user_id
        const is_admin = req.account_holder.user.is_admin;
        const is_super_admin = req.account_holder.user.is_super_admin

        // only admin can edit account
        if (!is_admin) { 
            return res.status(401).json({err: 'Unauthorized to perform operation'}) 
        }        

        const {user_id} = req.params

        const user_exist = await prisma.user.findFirst({ where: {user_id} })

        if (!user_exist) {
            return res.status(404).json({err: 'User not found'})
        }

        // an admin cannot edit a super admin account
        if ((logged_in_user_id != user_id) && (!is_super_admin && user_exist.is_admin)) {
            return res.status(400).json({err: 'Cannot make changes to an admin\'s account.'})
        }

        const update: any = {}

        update.updated_at = converted_datetime()

        if (first_name.trim() !== ''){ update.first_name = first_name }

        if (last_name.trim() !== ''){ update.last_name = last_name }

        if (email.trim() !== ''){ update.email = email }

        if (title.trim() !== ''){ update.title = title }

        if ((user_exist?.is_admin != req.body.is_admin) || (user_exist?.is_active != req.body.is_active)) {
            redis_auth_delete(user_exist?.user_id || '')

            // for account suspension
            if(!req.body.is_active && user_exist?.is_active){
                account_suspension_mail(user_exist)
            }else if(req.body.is_active && !user_exist?.is_active){
                account_reinstatement_mail(user_exist)
            }
            
            // for admin permission
            if (!req.body.is_admin && user_exist?.is_admin) {
                admin_priviledge_removal_mail(user_exist)
            }else if (req.body.is_admin && !user_exist?.is_admin){
                admin_priviledge_reinstatemnt_mail(user_exist)
            }
        }

        update.is_admin = req.body.is_admin

        update.is_active = is_active

        //  

        const edit_member = await prisma.user.update({
            where: {user_id},
            data: update
        })

        // user_account_created_mail(new_user, generated_password)
        return res.status(200).json({msg: 'Member updated successfully', user:edit_member})

    } catch (err:any) {
        console.log('Error occured during team member profile update ', err);
        return res.status(500).json({err:'Error occured during team member profile update ', error:err});
    }
}

export const delete_member = async (req:CustomRequest, res: Response) => {
    // 1. you should not be able to delete your self.
    // 2. an admin should not be able to delete another admin
    // 3. an admin should not edit another admin
    // 4. a superadmin can perform all operations
    try {

        const is_admin = req.account_holder.user.is_admin; 
        const is_super_admin = req.account_holder.user.is_super_admin

        const logged_in_user_id = req.account_holder.user.user_id

        const {user_id} = req.params

        const user_exist = await prisma.user.findFirst({ where: {user_id} })

        if (!user_exist) { return res.status(404).json({err: 'User not found'}) }

        if (user_exist.is_trashed){ return res.status(400).json({err: 'User already deleted'})}

        // condition 1: cannot delete self account
        if (logged_in_user_id === user_exist?.user_id) { 
            return res.status(400).json({err: 'Cannot delete own account'}) 
        }

        // condition 2: an admin cannot delete another admin account
        if ((is_admin && !is_super_admin) && !(user_exist.is_admin)){
            return res.status(401).json({err: 'Unathorized to delete accout'})
        }
        
        // condition 3: a superadmin account cannot be deleted
        if (user_exist.is_super_admin) {
            return res.status(401).json({err: 'Unathorized to delete accout'})
        }

        const [del_user]  = await Promise.all([
            prisma.user.update({
                where: {user_id}, data: {
                    is_trashed: true,
                    updated_at: converted_datetime()
                }
            }),
            prisma.trash.create({
                data:{
                    created_at: converted_datetime(),
                    updated_at: converted_datetime(),
                    deleted_user_id: user_id,
                    deleted_by_id: logged_in_user_id
                }
            })
        ]) 

        // send email and web push to user

        return res.status(200).json({msg: 'User deleted successfully'})
        
    } catch (err:any) {
        console.log('Error occured while deleting user ', err);
        return res.status(500).json({err:'Error occured while deleting user ', error:err});
    }
}

export const all_paginated_users = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.account_holder.user.user_id;

        const {list_number, page_number} = req.params

        const no_of_items_per_table = Number(list_number) || 15

        const [number_of_users, users ] = await Promise.all([

            prisma.user.count({ where: {is_trashed: false} }),

            prisma.user.findMany({
                where: {is_trashed: false},

                skip: (Math.abs(Number(page_number)) - 1) * no_of_items_per_table, take: no_of_items_per_table, orderBy: { created_at: 'desc'  } 
            }),

        ])
        
        const number_of_user_pages = (number_of_users <= no_of_items_per_table) ? 1 : Math.ceil(number_of_users / no_of_items_per_table)

        return res.status(200).json({ total_number_of_users: number_of_users, total_number_of_pages: number_of_user_pages, users })

    } catch (err:any) {
        console.log('Error occured while fetching all users ',err);
        return res.status(500).json({err:'Error occured while fetching all users ',error:err});
    }
}

