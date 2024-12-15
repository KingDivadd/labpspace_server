import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import converted_datetime from '../helpers/date_time_elements'
import { CustomRequest } from '../helpers/interface'
import {send_sms_otp} from '../helpers/sms_funtions'

export const all_paginated_todo_tasks = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.account_holder.user.user_id; 
        
        const {list_number, page_number} = req.params

        const no_of_items_per_table = Number(list_number) || 15

        const [number_of_tasks, tasks ] = await Promise.all([

            prisma.task.count({ where: {
                is_trashed: false,
                stage: 'todo',
                team: {
                    some: {
                        user_id
                    }
                }
            }}),

            prisma.task.findMany({
                where:{
                    is_trashed: false,
                    stage: 'todo',
                    team: {
                        some: {
                            user_id
                        }
                    }
                },
                include: {
                    activities: {
                        include: {
                            created_by: { // Fetch details of the user who created the activity
                                select: {
                                    first_name: true,
                                    last_name: true,
                                    email: true,
                                    avatar: true,
                                    title: true,
                                    is_active: true, is_admin: true, user_id: true
                                },
                            },
                        },
                    },
                    sub_tasks: true, // Include all fields of sub_tasks
                    team: {
                        include: {
                            user: { // Include user details in team assignments
                                select: {
                                    first_name: true,
                                    last_name: true,
                                    email: true,
                                    avatar: true,
                                    title: true,
                                    is_active: true, is_admin: true, user_id: true
                                },
                            },
                        },
                    },
                    task_creator: { // Optionally include task creator details
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                            title: true,
                            is_active: true, is_admin: true, user_id: true
                        },
                    },
                },
                orderBy:{created_at: 'asc'},
                skip: (Math.abs(Number(page_number)) - 1) * no_of_items_per_table,
            }),
            

        ])
        
        const number_of_task_pages = (number_of_tasks <= no_of_items_per_table) ? 1 : Math.ceil(number_of_tasks / no_of_items_per_table)

        return res.status(200).json({ total_number_of_tasks: number_of_tasks, total_number_of_pages: number_of_task_pages, tasks})

    } catch (err:any) {
        console.log('Error occured while fetching all paginated todo tasks ',err);
        return res.status(500).json({err:'Error occured while fetching all todo tasks ',error:err});
    }
}

export const all_paginated_tasks = async (req: CustomRequest, res: Response) => {
    try {
        const user_id = req.account_holder.user.user_id;
        const is_admin = req.account_holder.user.is_admin;

        const { list_number, page_number } = req.params;
        const no_of_items_per_table = Number(list_number) || 15;

        const taskWhereClause = is_admin
            ? { is_trashed: false } // Admins see all non-trashed tasks
            : {
                is_trashed: false,
                team: { some: { user_id } } // Non-admins see only tasks in their team
            };

        const [number_of_tasks, tasks, users, no_of_assigned_task] = await Promise.all([
            prisma.task.count({ where: taskWhereClause }),

            prisma.task.findMany({
                where: taskWhereClause,
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
                                    user_id: true
                                },
                            },
                        },
                    },
                    sub_tasks: true,
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
                                    user_id: true
                                },
                            },
                        },
                    },
                    task_creator: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                            title: true,
                            is_active: true,
                            is_admin: true,
                            user_id: true
                        },
                    },
                    payments: {
                        select: { amount: true }
                    }
                },
                orderBy: { created_at: 'asc' },
                skip: (Math.abs(Number(page_number)) - 1) * no_of_items_per_table,
            }),

            prisma.user.findMany({ where: { is_trashed: false } }),

            prisma.task.count({
                where: {
                    is_trashed: false,
                    team: {
                        some: {
                            user_id
                        }
                    }
                }
            })
        ]);

        // Add amount_due to each task
        const tasksWithAmountDue = tasks.map(task => {
            const totalPayments = task.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const amount_due = task.cost - totalPayments; // Assuming `cost` is a field in the task model
            return { ...task, total_amount_paid: totalPayments, amount_due }; // Add `amount_due` field to the task object
        });

        const number_of_task_pages = (number_of_tasks <= no_of_items_per_table) ? 1 : Math.ceil(number_of_tasks / no_of_items_per_table);

        return res.status(200).json({
            total_number_of_tasks: number_of_tasks,
            total_number_of_pages: number_of_task_pages,
            tasks: tasksWithAmountDue,
            users,
            no_of_assigned_task
        });

    } catch (err: any) {
        console.log('Error occurred while fetching all users ', err);
        return res.status(500).json({ err: 'Error occurred while fetching all users', error: err });
    }
};

export const create_new_activity = async (req: CustomRequest, res: Response) => {
    const {description, activity_type} = req.body
    try {
        
        const user_id = req.account_holder.user.user_id

        const {task_id} = req.params

        const task_assignees = await prisma.taskAssignment.findMany({
            where: {task_id},
            select: {user: {select: {user_id: true}}}
        })

        const team:any[] = []

        task_assignees.forEach((data:any) => {
            team.push(data.user.user_id)
        });

        const new_notification = await prisma.notification.create({
            data: {
                status: 'completed',
                task_id: task_id,
                notification_type: 'task',
                notification_sub_type: 'task_update',
                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        // Prepare data for bulk inserts
        const current_datetime = converted_datetime();

        const notificationAssignment = team.map((team_member_id: any)=>({

            notification_id: new_notification.notification_id,
            user_id: team_member_id,
            created_at: current_datetime, updated_at: current_datetime,
        }))

        // Perform bulk inserts in parallel
        const [activitiesResult, notification_result] = await Promise.all([
            prisma.activity.create({ data: {
                activity_type: activity_type,
                task_id: task_id,
                created_by_id: user_id,
                description: description,
                date: current_datetime,
                created_at: current_datetime,
                updated_at: current_datetime,
            } }),
            prisma.notificationAssignment.createMany({data: notificationAssignment})
        ]);

        return res.status(201).json({
            msg: 'Timeline Updated',
        })

    } catch (err:any) {
        console.log('Error creating new activity', err);
        return res.status(500).json({err: 'Error creating new activity', error:err});
    }
}

export const create_sub_task = async (req: CustomRequest, res: Response) => {
    const {title, due_date, tag} = req.body
    try {
        const user_id = req.account_holder.user.user_id;
        const user = req.account_holder.user

        const {task_id} = req.params

        const task_assignees = await prisma.taskAssignment.findMany({
            where: {task_id},
            select: {user: {select: {user_id: true}}}
        })

        const team:any[] = []

        task_assignees.forEach((data:any) => {
            team.push(data.user.user_id)
        });

        const [new_sub_task, new_notification, ] = await Promise.all([

            prisma.subTask.create({
                data: {
                    title, due_date, tag, task_id, sub_task_created_by_id:user_id,
                    created_at: converted_datetime(), updated_at: converted_datetime()
                }
            }),

            prisma.notification.create({
                data: {
                    status: 'completed',
                    task_id: task_id,
                    notification_type: 'task',
                    notification_sub_type: 'task_update',
                    created_at: converted_datetime(), updated_at: converted_datetime()
                }
            })

        ])

        // Prepare data for bulk inserts
        const current_datetime = converted_datetime();

        const notificationAssignment = team.map((team_member_id: any)=>({

            notification_id: new_notification.notification_id,
            user_id: team_member_id,
            created_at: current_datetime, updated_at: current_datetime,
        }))

        const desc_value = `A new sub task with title ${title} has been created by ${user?.first_name} ${user?.last_name}.`

        // Perform bulk inserts in parallel
        const [activitiesResult, notification_result] = await Promise.all([
            prisma.activity.create({ data: {
                activity_type:'updated',
                task_id: task_id,
                created_by_id: user_id,
                description: desc_value,
                date: current_datetime,
                created_at: current_datetime,
                updated_at: current_datetime,
            } }),
            prisma.notificationAssignment.createMany({data: notificationAssignment})
        ]);

        return res.status(201).json({
            msg: 'New subtask created',
        })

    } catch (err:any) {
        console.log('Error creating subtask ', err);
        return res.status(500).json({err:'Error creating subtask ', error:err});
    }
}

export const create_task = async (req: CustomRequest, res: Response, next: NextFunction) => {

    const { task_title, priority, stage, assets, team, cost } = req.body;

    const startTime = Date.now(); // Record start time

    console.time("Task Creation Execution Time"); // Start the timer

    try {
        const user = req.account_holder.user;

        if (!user.is_admin) {
            return res.status(401).json({ err: 'Not authorized to perform operation!' });
        }

        // Fetch the last task index in a minimal query
        const last_task_number = await prisma.task.findFirst({
            orderBy: { created_at: 'desc' },
            take: 1,
            select: { task_ind: true },
        }).then(last_task => last_task ? parseInt(last_task.task_ind.slice(2)) : 0);

        const new_task_number = last_task_number + 1;
        const new_task_ind = `TS${new_task_number.toString().padStart(4, '0')}`;

        // Create the new task
        const new_task = await prisma.task.create({
            data: {
                task_ind: new_task_ind,
                task_creator: { connect: { user_id: user.user_id } },
                task_title,
                priority,
                stage,
                assets,
                cost,
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            },
        });

        const new_notification = await prisma.notification.create({
            data: {
                status: 'completed',
                task_id: new_task.task_id,
                notification_type: 'task',
                notification_sub_type: 'task_creation',
                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        
        // Prepare data for bulk inserts
        const current_datetime = converted_datetime();
        const taskAssignments = team.map((team_member_id: any) => ({
            task_id: new_task.task_id,
            user_id: team_member_id,
            assigned_at: current_datetime,
            created_at: current_datetime,
            updated_at: current_datetime,
        }));

        const notificationAssignment = team.map((team_member_id: any)=>({
            notification_id: new_notification.notification_id,
            user_id: team_member_id,
            created_at: current_datetime, updated_at: current_datetime,
        }))

        const desc_value = new_task.task_creator_id == user.user_id ? 
            `New Task with a set ${priority.toUpperCase()} priority has been created by you. You've also assigned the tasks to ${team.length - 1} team member(s). Please proceed with the task execution.`
            : 
            `New Task  with a set ${priority.toUpperCase()} priority has been assigned to you and ${team.length - 1} other team members. Please check and proceed with the task execution`

        // Perform bulk inserts in parallel
        const [teams, activitiesResult, notification_result] = await Promise.all([
            prisma.taskAssignment.createMany({ data: taskAssignments }),
            prisma.activity.create({ data: {
                task_id: new_task.task_id,
                created_by_id: user.user_id,
                description: desc_value,
                date: current_datetime,
                created_at: current_datetime,
                updated_at: current_datetime,
            } }),
            prisma.notificationAssignment.createMany({data: notificationAssignment})
        ]);
        
        console.timeEnd("Task Creation Execution Time"); // End the timer
        
        return res.status(201).json({
            msg: 'Task created successfully',
            new_task,
            team_count: teams.count, // `createMany` returns the count of inserted records
            activity: activitiesResult,
        });
    } catch (err: any) {
        console.timeEnd("Task Creation Execution Time"); // Ensure timer ends even in case of error
        console.log('Error creating new task ', err);
        return res.status(500).json({ err: 'Error creating new task', error: err });
    }
};

export const edit_task = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { task_title, priority, stage, assets, cost, team } = req.body;

    const {task_id} = req.params

    console.time("Task Edit Execution Time"); // Start the timer

    try {
        const user = req.account_holder.user;

        // Ensure user has admin privileges
        if (!user.is_admin) {
            return res.status(401).json({ err: 'Not authorized to perform operation!' });
        }

        // Fetch the existing task
        const existing_task = await prisma.task.findUnique({
            where: { task_id },
            include: { team: true },
        });

        if (!existing_task) {
            return res.status(404).json({ err: 'Task not found!' });
        }

        const current_datetime = converted_datetime();

        // Update task details
        const updated_task = await prisma.task.update({
            where: { task_id },
            data: {
                task_title: task_title ?? existing_task.task_title,
                priority: priority ?? existing_task.priority,
                stage: stage ?? existing_task.stage,
                assets: assets ?? existing_task.assets,
                cost: cost ?? existing_task.cost,
                updated_at: current_datetime,
            },
        });

        // Handle team updates
        if (team && Array.isArray(team)) {
            // Fetch existing team member IDs
            const existing_team_ids = existing_task.team.map((member) => member.user_id);

            // Identify new team members and removed team members
            const new_team_members = team.filter((id) => !existing_team_ids.includes(id));
            const removed_team_members = existing_team_ids.filter((id) => !team.includes(id));

            // Assign new team members
            const taskAssignments = new_team_members.map((team_member_id) => ({
                task_id: updated_task.task_id,
                user_id: team_member_id,
                assigned_at: current_datetime,
                created_at: current_datetime,
                updated_at: current_datetime,
            }));

            // Remove team members
            await prisma.taskAssignment.deleteMany({
                where: {
                    task_id: updated_task.task_id,
                    user_id: { in: removed_team_members },
                },
            });

            // Add new team members
            if (taskAssignments.length > 0) {
                await prisma.taskAssignment.createMany({ data: taskAssignments });
            }
        }

        // Add an activity log for the edit
        const desc_value = `Task "${existing_task.task_title}" was updated by ${user.first_name} ${user.last_name}.`;

        const activity_log = await prisma.activity.create({
            data: {
                activity_type: 'updated',
                task_id: updated_task.task_id,
                created_by_id: user.user_id,
                description: desc_value,
                date: current_datetime,
                created_at: current_datetime,
                updated_at: current_datetime,
            },
        });

        // Notify team members about the update
        const notification = await prisma.notification.create({
            data: {
                status: 'pending',
                task_id: updated_task.task_id,
                notification_type: 'task',
                notification_sub_type: 'task_update',
                created_at: current_datetime,
                updated_at: current_datetime,
            },
        });

        const notificationAssignments = team.map((team_member_id:string) => ({
            notification_id: notification.notification_id,
            user_id: team_member_id,
            created_at: current_datetime,
            updated_at: current_datetime,
        }));

        await prisma.notificationAssignment.createMany({ data: notificationAssignments });

        console.timeEnd("Task Edit Execution Time"); // End the timer

        return res.status(200).json({
            msg: 'Task updated successfully',
            updated_task,
            activity: activity_log,
        });
    } catch (err: any) {
        console.timeEnd("Task Edit Execution Time"); // Ensure timer ends even in case of error
        console.log('Error editing task', err);
        return res.status(500).json({ err: 'Error editing task', error: err });
    }
};


// export const edit_task = async (req: CustomRequest, res: Response, next: NextFunction) => {
//     const { task_title, priority, stage, assets, team,cost } = req.body;
//     const { task_id } = req.params;
//     console.time("Task Creation Execution Time"); // Start the timer
//     try {
//         const user = req.account_holder.user;
//         req.body.priority = priority.toLowerCase()
//         req.body.stage = stage.toLowerCase()


//         // Check if the user is authorized to edit tasks
//         if (!user.is_admin) {
//             return res.status(401).json({ err: 'Not authorized to edit tasks!' });
//         }

//         // Start a Prisma transaction
//         const result = await prisma.$transaction(async (tx) => {
//             // Fetch the task
//             const task = await tx.task.findUnique({
//                 where: { task_id },
//                 include: { team: true },
//             });

//             if (!task) {
//                 throw new Error('Task not found');
//             }

//             // Update task details
//             const updated_task = await tx.task.update({
//                 where: { task_id },
//                 data: {
//                     ...(task_title && { task_title }),
//                     ...(priority && { priority }),
//                     ...(stage && { stage }),
//                     ...(assets && { assets }),
//                     ...(cost && {cost}),
//                     updated_at: converted_datetime(),
//                 },
//             });

//             // Update task assignments
//             const existing_assignments = task.team.map((ta:any) => ta.user_id);
//             const new_assignments = team.filter((user_id: string) => !existing_assignments.includes(user_id));
//             const removed_assignments = existing_assignments.filter((user_id: string) => !team.includes(user_id));

//             // Add new assignments
//             if (new_assignments.length > 0) {
//                 const task_assignments = new_assignments.map((user_id: string) => ({
//                     task_id,
//                     user_id,
//                     assigned_at: converted_datetime(),
//                     created_at: converted_datetime(),
//                     updated_at: converted_datetime(),
//                 }));
//                 await tx.taskAssignment.createMany({ data: task_assignments });
//             }

//             // Remove old assignments
//             if (removed_assignments.length > 0) {
//                 await tx.taskAssignment.deleteMany({
//                     where: {
//                         task_id,
//                         user_id: { in: removed_assignments },
//                     },
//                 });
//             }

//             // Log activity for task updates
//             await tx.activity.create({
//                 data: {
//                     // activity_type: 'updated',
//                     description: `Task "${task_title || task.task_title}" was updated.`,
//                     date: converted_datetime(),
//                     created_by: {
//                         connect: { user_id: user.user_id },
//                     },
//                     task: {
//                         connect: { task_id },
//                     },
//                     created_at: converted_datetime(),
//                     updated_at: converted_datetime(),
//                 },
//             });

//             return updated_task;
//         });

//         console.timeEnd("Task Creation Execution Time"); // End the timer


//         // Respond with the updated task
//         return res.status(200).json({ msg: 'Task updated successfully with activity log', success: true, task: result });
//     } catch (err: any) {
//         console.error('Error occurred while editing task: ', err);
//         return res.status(500).json({
//             err: 'Error occurred while editing task',
//             error: err.message,
//         });
//     }
// };

export const delete_task = async (req:CustomRequest, res: Response) => {
    try {
        
        const user_id = req.account_holder.user.user_id; const is_admin = req.account_holder.user.is_admin
        
        const {task_id} = req.params

        const task_exist = await prisma.task.findUnique({ where: {task_id}, include: {task_creator: {select: {first_name: true, last_name: true}}}})

        if (!task_exist){ return res.status(404).json({err: 'Task not found!'})}

        if (task_exist.is_trashed){ return res.status(400).json({err: 'Task deleted successfully'})}

        if ((is_admin && task_exist.task_creator_id !== user_id)) {
            return res.status(401).json({err: `Not authorized to delete task, refer to ${task_exist.task_creator.first_name} ${task_exist.task_creator.last_name}`})
        }

        if (!is_admin) { return res.status(401).json({err: 'Not authorized to perform operation'}) }

        const [delete_task, trash_task] = await Promise.all([
            prisma.task.update({ where: {task_id}, data: {is_trashed: true, updated_at: converted_datetime()} }),
            prisma.trash.create({
                data: {
                    deleted_by_id: user_id,
                    deleted_task_id: task_id,
                    created_at: converted_datetime(), updated_at: converted_datetime()
                }
            })
        ])

        return res.status(200).json({msg: 'Task deleted successfully'})

    } catch (err:any) {
        console.log('Error deleting seleted task ', err);
        return res.status(500).json({err:'Error deleting seleted task ', error:err});
    }
}