import express from 'express'


import {
        test_basic_connection, 
        test_db_connection} from '../controllers/test_connection'

import {
        login_validation,
        signup_validation, } from '../validations/index'

import { 
        email_exist} from '../helpers/auth_helper'

import {
        login,
        signup } from '../controllers/authentication'

import {
        welcome_notification} from '../controllers/notification'

const router = express.Router()

// authentication

router.route('/signup').post(signup_validation, email_exist, signup, welcome_notification)

router.route('/login').post(login_validation, login)

router.route('/test-basic-connection').get(test_basic_connection)

router.route('/test-db-connection').get(test_db_connection)

export default router