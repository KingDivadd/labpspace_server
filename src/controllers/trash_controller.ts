import { Request, Response, NextFunction } from 'express'
import { CustomRequest } from '../helpers/interface'
import prisma from '../helpers/prisma_initializer'
import { redis_url, termii_api_key } from '../helpers/constants'
import { toEditorSettings } from 'typescript'
import converted_datetime from '../helpers/date_time_elements'

export const all_paginated_trash = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.account_holder.user.user_id;

        const {list_number, page_number} = req.params

        const no_of_items_per_table = Number(list_number) || 15

        const [number_of_trash, trash ] = await Promise.all([

            prisma.trash.count({ }),

            prisma.trash.findMany({
                include: {
                    deleted_by: {
                        select:{
                            first_name: true, last_name: true, email: true, avatar: true,
                        }
                    },
                    deleted_project:{
                        include: {
                            team: {
                                include: {
                                    user:{
                                        select: {first_name: true, last_name: true, avatar: true, is_admin: true, is_active: true}
                                    }
                                }
                            }
                        }
                    },
                    deleted_user:true
                },

                skip: (Math.abs(Number(page_number)) - 1) * no_of_items_per_table, take: no_of_items_per_table, orderBy: { created_at: 'desc'  } 
            }),

        ])
        
        const number_of_trash_pages = (number_of_trash <= no_of_items_per_table) ? 1 : Math.ceil(number_of_trash / no_of_items_per_table)

        return res.status(200).json({ total_number_of_trash: number_of_trash, total_number_of_pages: number_of_trash_pages, trash })

    } catch (err:any) {
        console.log('Error occured while fetching all trash ',err);
        return res.status(500).json({err:'Error occured while fetching all trash ',error:err});
    }
}

export const delete_selected_trash = async (req:CustomRequest, res: Response) => {
    try {


        const user_id = req.account_holder.user.user_id;   const role = req.account_holder.user.is_admin

        const {trash_id} = req.params

        const trash_exist = await prisma.trash.findUnique({
                where: {trash_id},
                include: {
                    deleted_by: {
                        select: {first_name: true, last_name: true, user_id: true}
                    }
                }
            })


        if (!trash_exist){
            return res.status(404).json({err: 'File not found.'})
        }

        // if (trash_exist?.deleted_by?.user_id !== user_id) {
        //     return res.status(401).json({err: `Only ${trash_exist?.deleted_by?.first_name} ${trash_exist?.deleted_by?.last_name} is authorized to delete selected file.`})
        // }

        let del_user;
        let del_trash;

        await prisma.$transaction(async (tx) => {
            if (trash_exist.deleted_project_id) {
                await Promise.all([
                    tx.projectAssignment.deleteMany({ where: { project_id: trash_exist.deleted_project_id } }),
                    tx.activity.deleteMany({ where: { project_id: trash_exist.deleted_project_id } }),
                    tx.task.deleteMany({ where: { project_id: trash_exist.deleted_project_id } }),
                    tx.trash.delete({ where: { trash_id } }),
                    tx.project.delete({ where: { project_id: trash_exist.deleted_project_id } }),
                ]);
            } else if (trash_exist.deleted_user_id) {
                await Promise.all([
                    tx.session.deleteMany({ where: { user_id: trash_exist.deleted_user_id } }),
                    tx.activity.deleteMany({ where: { created_by_id: trash_exist.deleted_user_id } }),
                    tx.project.deleteMany({ where: { project_creator_id: trash_exist.deleted_user_id } }),
                    tx.projectAssignment.deleteMany({ where: { user_id: trash_exist.deleted_user_id } }),
                    tx.notificationAssignment.deleteMany({ where: { user_id: trash_exist.deleted_user_id } }),
                    tx.trash.deleteMany({ where: { deleted_by_id: trash_exist.deleted_user_id } }),
                    tx.paymentHistory.deleteMany({ where: { added_by_id: trash_exist.deleted_user_id } }),
                    tx.task.deleteMany({ where: { task_created_by_id: trash_exist.deleted_user_id } }),
                    tx.trash.delete({ where: { trash_id } }),
                    tx.user.delete({ where: { user_id: trash_exist.deleted_user_id } }),
                ]);
            }
        });

        console.log('delted file ', del_user)

        return res.status(200).json({
            msg: 'Trash has been permanently deleted'
        })

    } catch (err: any) {
        if (err.code === 'P2003' || err.code == 'P2028') { // Foreign key constraint error
            console.log(err)
            return res.status(400).json({
                err: 'Please try again',
            });
        }
        console.error('Error deleting trash or user:', err);
        return res.status(500).json({ err: 'Error deleting selected entity', error: err.message });
    }    
}

export const restore_selected_trash = async (req:CustomRequest, res: Response) => {
    try {
        const {trash_id} = req.params

        const trash_exist = await prisma.trash.findUnique({ where: {trash_id}})

        if (!trash_exist){return res.status(404).json({err: 'Trash not found'})}

        let restored_user;

        if (trash_exist.deleted_project_id) {
            await Promise.all([
                prisma.project.update({
                    where: {project_id: trash_exist.deleted_project_id}, 
                    data: {is_trashed: false, updated_at: converted_datetime()}}),
                prisma.trash.delete({where: {trash_id}})
            ])
        }else if (trash_exist.deleted_user_id){
            restored_user = await Promise.all([
                prisma.user.update({where: {user_id: trash_exist.deleted_user_id }, data: {is_trashed: false, updated_at: converted_datetime()}}),
                prisma.trash.delete({where: {trash_id}})
            ])
        }


        return res.status(200).json({msg: 'Selected File has been restored.'})

    } catch (err:any) {
        console.log('Error restoring trash ', err);
        return res.status(500).json({err:'Error restoring trash ', error:err});
    }
}

// export const restore_all_trash = async (req:CustomRequest, res: Response) => {
//     try {
//         const {trash_id} = req.params

//         const all_trash = await prisma.trash.findMany({})

//         if (!all_trash.length){return res.status(404).json({err: 'You currently have no trash to restore.'})}

//         const user_trash:any[] = []
//         const task_trash:any[] = []
//         let restore_user_ass:any
//         let restore_task_ass:any

//         all_trash.map((data:any)=>{
//             if (data.deleted_user_id) {
//                 user_trash.push(data)        
//             }else if(data.delete_project_id){
//                 task_trash.push(data)
//             }
//         })

//         if (user_trash.length) {
//             restore_user_ass = user_trash.map((data:any)=>({
//                 where: {user_id: data.deleted_user_id },
//                 is_trashed: false, updated_at: converted_datetime()
//             }))
//         }

//         if (task_trash.length) {
//             restore_task_ass = task_trash.map((data:any)=>({
//                 where:{},
//                 is_trashed: false, updated_at: converted_datetime()
//             }))
//         }

//         const [] = await Promise.all([

//         ])



//         return res.status(200).json({msg: 'all trash has been restored successfully.'})

//     } catch (err:any) {
//         console.log('Error restoring trash ', err);
//         return res.status(500).json({err:'Error restoring trash ', error:err});
//     }
// }