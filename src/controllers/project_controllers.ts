import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import converted_datetime from '../helpers/date_time_elements'
import { CustomRequest } from '../helpers/interface'
import {send_sms_otp} from '../helpers/sms_funtions'

export const all_paginated_todo_projects = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.account_holder.user.user_id; 
        
        const {list_number, page_number} = req.params

        const no_of_items_per_table = Number(list_number) || 15

        const [number_of_projects, tasks ] = await Promise.all([

            prisma.project.count({ where: {
                is_trashed: false,
                stage: 'todo',
                team: {
                    some: {
                        user_id
                    }
                }
            }}),

            prisma.project.findMany({
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
                    tasks: true, // Include all fields of sub_projects
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
                    project_creator: { // Optionally include task creator details
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
                orderBy:{created_at: 'desc'},
                skip: (Math.abs(Number(page_number)) - 1) * no_of_items_per_table,
            }),
            

        ])
        
        const number_of_project_pages = (number_of_projects <= no_of_items_per_table) ? 1 : Math.ceil(number_of_projects / no_of_items_per_table)

        return res.status(200).json({ total_number_of_projects: number_of_projects, total_number_of_pages: number_of_project_pages, tasks})

    } catch (err:any) {
        console.log('Error occured while fetching all paginated todo tasks ',err);
        return res.status(500).json({err:'Error occured while fetching all todo tasks ',error:err});
    }
}

export const all_paginated_projects = async (req: CustomRequest, res: Response) => {
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

        const [number_of_projects, tasks, users, no_of_assigned_project] = await Promise.all([
            prisma.project.count({ where: taskWhereClause }),

            prisma.project.findMany({
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
                                    user_id: true
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
                            user_id: true
                        },
                    },
                    payments: {
                        select: { amount: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip: (Math.abs(Number(page_number)) - 1) * no_of_items_per_table,
            }),

            prisma.user.findMany({ where: { is_trashed: false } }),

            prisma.project.count({
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

        const number_of_project_pages = (number_of_projects <= no_of_items_per_table) ? 1 : Math.ceil(number_of_projects / no_of_items_per_table);

        return res.status(200).json({
            total_number_of_projects: number_of_projects,
            total_number_of_pages: number_of_project_pages,
            tasks: tasksWithAmountDue,
            users,
            no_of_assigned_project
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

        const {project_id} = req.params

        const project_assignees = await prisma.projectAssignment.findMany({
            where: {project_id},
            select: {user: {select: {user_id: true}}}
        })

        const team:any[] = []

        project_assignees.forEach((data:any) => {
            team.push(data.user.user_id)
        });

        const new_notification = await prisma.notification.create({
            data: {
                status: 'completed',
                project_id: project_id,
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
                project_id: project_id,
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

export const create_task = async (req: CustomRequest, res: Response) => {
    const {title, due_date, is_completed} = req.body
    try {
        const user_id = req.account_holder.user.user_id;
        const user = req.account_holder.user

        const {project_id} = req.params

        const project_assignees = await prisma.projectAssignment.findMany({
            where: {project_id},
            select: {user: {select: {user_id: true}}}
        })

        const team:any[] = []

        project_assignees.forEach((data:any) => {
            team.push(data.user.user_id)
        });

        const [new_project, new_notification, ] = await Promise.all([

            prisma.task.create({
                data: {
                    title, due_date, is_completed, project_id, task_created_by:user_id,
                    created_at: converted_datetime(), updated_at: converted_datetime()
                }
            }),

            prisma.notification.create({
                data: {
                    status: 'completed',
                    project_id: project_id,
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
                project_id: project_id,
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

export const create_project = async (req: CustomRequest, res: Response, next: NextFunction) => {

    const { project_title, priority, stage, assets, team, cost } = req.body;

    const startTime = Date.now(); // Record start time

    console.time("Task Creation Execution Time"); // Start the timer

    try {
        const user = req.account_holder.user;

        if (!user.is_admin) {
            return res.status(401).json({ err: 'Not authorized to perform operation!' });
        }

        // Fetch the last task index in a minimal query
        const last_project_number = await prisma.project.findFirst({
            orderBy: { created_at: 'desc' },
            take: 1,
            select: { project_ind: true },
        }).then(last_project => last_project ? parseInt(last_project.project_ind.slice(2)) : 0);

        const new_project_number = last_project_number + 1;
        const new_project_ind = `PJ${new_project_number.toString().padStart(4, '0')}`;

        // Create the new Project
        const new_project = await prisma.project.create({
            data: {
                project_ind: new_project_ind,
                project_creator: { connect: { user_id: user.user_id } },
                project_title,
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
                project_id: new_project.project_id,
                notification_type: 'task',
                notification_sub_type: 'task_creation',
                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        
        // Prepare data for bulk inserts
        const current_datetime = converted_datetime();
        const taskAssignments = team.map((team_member_id: any) => ({
            project_id: new_project.project_id,
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

        const desc_value = new_project.project_creator_id == user.user_id ? 
            `New Project with a set ${priority.toUpperCase()} priority has been created by you. You've also assigned the tasks to ${team.length} team member(s). Please proceed with the task execution.`
            : 
            `New Project  with a set ${priority.toUpperCase()} priority has been assigned to you and ${team.length} other team members. Please check and proceed with the task execution`

        // Perform bulk inserts in parallel
        const [teams, activitiesResult, notification_result] = await Promise.all([
            prisma.projectAssignment.createMany({ data: taskAssignments }),
            prisma.activity.create({ data: {
                project_id: new_project.project_id,
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
            new_project,
            team_count: teams.count, // `createMany` returns the count of inserted records
            activity: activitiesResult,
        });
    } catch (err: any) {
        console.timeEnd("Task Creation Execution Time"); // Ensure timer ends even in case of error
        console.log('Error creating new Project ', err);
        return res.status(500).json({ err: 'Error creating new Project', error: err });
    }
};

export const edit_project = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { project_title, priority, stage, assets, cost, team } = req.body;

    const {project_id} = req.params

    console.time("Task Edit Execution Time"); // Start the timer

    try {
        const user = req.account_holder.user;

        // Ensure user has admin privileges
        if (!user.is_admin) {
            return res.status(401).json({ err: 'Not authorized to perform operation!' });
        }

        // Fetch the existing task
        const existing_project = await prisma.project.findUnique({
            where: { project_id },
            include: { team: true },
        });

        if (!existing_project) {
            return res.status(404).json({ err: 'Task not found!' });
        }

        const current_datetime = converted_datetime();

        // Update task details
        const updated_project = await prisma.project.update({
            where: { project_id },
            data: {
                project_title: project_title ?? existing_project.project_title,
                priority: priority ?? existing_project.priority,
                stage: stage ?? existing_project.stage,
                assets: assets ?? existing_project.assets,
                cost: cost ?? existing_project.cost,
                updated_at: current_datetime,
            },
        });

        // Handle team updates
        if (team && Array.isArray(team)) {
            // Fetch existing team member IDs
            const existing_team_ids = existing_project.team.map((member) => member.user_id);

            // Identify new team members and removed team members
            const new_team_members = team.filter((id) => !existing_team_ids.includes(id));
            const removed_team_members = existing_team_ids.filter((id) => !team.includes(id));

            // Assign new team members
            const taskAssignments = new_team_members.map((team_member_id) => ({
                project_id: updated_project.project_id,
                user_id: team_member_id,
                assigned_at: current_datetime,
                created_at: current_datetime,
                updated_at: current_datetime,
            }));

            // Remove team members
            await prisma.projectAssignment.deleteMany({
                where: {
                    project_id: updated_project.project_id,
                    user_id: { in: removed_team_members },
                },
            });

            // Add new team members
            if (taskAssignments.length > 0) {
                await prisma.projectAssignment.createMany({ data: taskAssignments });
            }
        }

        // Add an activity log for the edit
        const desc_value = `Task "${existing_project.project_title}" was updated by ${user.first_name} ${user.last_name}.`;

        const activity_log = await prisma.activity.create({
            data: {
                activity_type: 'updated',
                project_id: updated_project.project_id,
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
                project_id: updated_project.project_id,
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
            updated_project,
            activity: activity_log,
        });
    } catch (err: any) {
        console.timeEnd("Task Edit Execution Time"); // Ensure timer ends even in case of error
        console.log('Error editing task', err);
        return res.status(500).json({ err: 'Error editing task', error: err });
    }
};

export const delete_project = async (req:CustomRequest, res: Response) => {
    try {
        
        const user_id = req.account_holder.user.user_id; const is_admin = req.account_holder.user.is_admin
        
        const {project_id} = req.params

        const task_exist = await prisma.project.findUnique({ where: {project_id}, include: {project_creator: {select: {first_name: true, last_name: true}}}})

        if (!task_exist){ return res.status(404).json({err: 'Task not found!'})}

        if (task_exist.is_trashed){ return res.status(400).json({err: 'Task deleted successfully'})}

        if ((is_admin && task_exist.project_creator_id !== user_id)) {
            return res.status(401).json({err: `Not authorized to delete task, refer to ${task_exist.project_creator.first_name} ${task_exist.project_creator.last_name}`})
        }

        if (!is_admin) { return res.status(401).json({err: 'Not authorized to perform operation'}) }

        const [delete_proj, trash_project] = await Promise.all([
            prisma.project.update({ where: {project_id}, data: {is_trashed: true, updated_at: converted_datetime()} }),
            prisma.trash.create({
                data: {
                    deleted_by_id: user_id,
                    deleted_project_id: project_id,
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