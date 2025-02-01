import express from 'express'


import {

        add_new_payment,
        all_paginated_payments,
        edit_payment} from '../controllers/payment_controler'

import {
        all_paginated_trash,
        delete_selected_trash,
        restore_selected_trash} from '../controllers/trash_controller'

import {
        test_basic_connection, 
        test_db_connection} from '../controllers/test_connection'

import {
        generate_otp_validation,
        login_validation,
        project_validation,
        new_user_validation,
        profile_validation,
        reset_password_validation,
        signup_validation,
        verify_otp_validation,
        payment_validation,
        avatar_validation,
        task_validation,
        activity_validation,
        save_subscription_validation, } from '../validations/index'

import { 
        email_exist,
        verify_auth_id,
        verify_otp_status} from '../helpers/auth_helper'

import {
        change_avatar,
        generate_user_otp,
        login,
        persist_login,
        profile_update,
        register_user,
        reset_password,
        signup, 
        verify_otp} from '../controllers/authentication'

import {
        paginated_user_notification,
        push_notification,
        read_notification,
        save_subscription,
        unread_user_notification,
        welcome_notification_2} from '../controllers/notification'

import {
        add_new_member,
        admin_dashboard,
        all_paginated_users,
        delete_member,
        edit_member}  from "../controllers/team_members"

import {
        all_paginated_projects, 
        all_paginated_todo_projects, 
        create_new_activity, 
        create_project,
        create_task,
        complete_task,
        delete_project,
        edit_project,
        edit_task,
        delete_task} from "../controllers/project_controllers"


const router = express.Router()

// authentication

router.route('/signup').post(email_exist, signup_validation, signup)

router.route('/login').post(login_validation, login )

router.route('/save-subscription').post(verify_auth_id, save_subscription_validation, save_subscription)

router.route('/persist-login').post(verify_auth_id, persist_login )

router.route('/register-user').post(signup_validation, verify_auth_id, email_exist, register_user)

router.route('/generate-otp').post(generate_otp_validation, generate_user_otp)

router.route('/verify-otp').post(verify_otp_validation, verify_otp_status, verify_otp )

router.route('/reset-password').post(verify_auth_id, reset_password_validation, reset_password)

router.route('/update-profile').patch(verify_auth_id, profile_validation, profile_update)

router.route('/change-avatar').patch(verify_auth_id, avatar_validation, change_avatar)

// Users

router.route('/admin-dashboard').get(verify_auth_id, admin_dashboard)

router.route('/all-paginated-users/:list_number/:page_number').get(verify_auth_id, all_paginated_users)

router.route('/all-paginated-users/:list_number/:page_number').get(verify_auth_id, all_paginated_users)

router.route('/add-user').post(verify_auth_id, new_user_validation, email_exist, add_new_member )

router.route('/edit-member/:user_id').patch(verify_auth_id, new_user_validation, edit_member)

router.route('/delete-user/:user_id').delete(verify_auth_id, delete_member)

// Notification

router.route('/all-paginated-notification/:list_number/:page_number').get(verify_auth_id, paginated_user_notification)

router.route('/unread-notification').get(verify_auth_id, unread_user_notification)

router.route('/read-notification/:notificationAssignment_id').patch(verify_auth_id, read_notification)

// Projects

router.route('/all-paginated-projects/:list_number/:page_number').get(verify_auth_id, all_paginated_projects)

router.route('/all-paginated-todo-projects/:list_number/:page_number').get(verify_auth_id, all_paginated_todo_projects)

router.route('/create-project').post(verify_auth_id, project_validation, create_project)

router.route('/create-task/:project_id').post(verify_auth_id, task_validation, create_task )

router.route('/edit-task/:task_id/:project_id').patch(verify_auth_id, task_validation, edit_task )

router.route('/complete-task/:task_id/:project_id').patch(verify_auth_id, complete_task)

router.route('/delete-task/:task_id/:project_id').delete(verify_auth_id, delete_task)

router.route('/add-activity/:project_id').post(verify_auth_id, activity_validation, create_new_activity)

router.route('/edit-project/:project_id').patch(verify_auth_id, project_validation, edit_project)

router.route('/delete-project/:project_id').delete(verify_auth_id, delete_project)

// Payments

router.route('/all-paginated-payments/:project_id/:list_number/:page_number').get(verify_auth_id, all_paginated_payments)

router.route('/add-payment').post(verify_auth_id, payment_validation, add_new_payment)

router.route('/edit-payment/:payment_id').patch(verify_auth_id, payment_validation, edit_payment)

// Trash

router.route('/all-paginated-trash/:list_number/:page_number').get(verify_auth_id, all_paginated_trash)

router.route('/delete-trash/:trash_id').delete(verify_auth_id, delete_selected_trash)

router.route('/restore-trash/:trash_id').patch(verify_auth_id, restore_selected_trash)


// Test Connections

router.route('/test-push-notification').get(push_notification)

router.route('/test-basic-connection').get(test_basic_connection)

router.route('/test-db-connection').get(test_db_connection)

export default router