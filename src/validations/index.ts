import { Request, Response, NextFunction } from 'express';
import Joi from 'joi'


export const signup_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            last_name: Joi.string().trim().required(),
            first_name: Joi.string().trim().required(),
            title: Joi.string().trim().allow('').optional(),
            role: Joi.string().trim().required(),
            email: Joi.string().trim().email().required(),
            password: Joi.string().trim().required(),
            is_admin: Joi.boolean().optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in signup validation function ',err)
        return res.status(422).json({err: 'Error occured in signup validation funtion ', error: err})
        
    }
}

export const login_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            email: Joi.string().trim().email().required(),
            password: Joi.string().trim().required(),
            remember_me: Joi.boolean().optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in signup validation function ',err)
        return res.status(422).json({err: 'Error occured in signup validation funtion ', error: err})
        
    }
}

export const generate_otp_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            email: Joi.string().trim().email().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in otp validation function ',err)
        return res.status(422).json({err: 'Error occured in otp validation funtion ', error: err})
        
    }
}

export const verify_otp_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            email: Joi.string().trim().email().required(),
            otp: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in otp validation function ',err)
        return res.status(422).json({err: 'Error occured in otp validation funtion ', error: err})
        
    }
}

export const reset_password_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            confirm_password: Joi.string().trim().required(),
            password: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in password reset validation function ',err)
        return res.status(422).json({err: 'Error occured in password reset validation funtion ', error: err})
        
    }
}

export const profile_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            last_name: Joi.string().trim().required(),
            first_name: Joi.string().trim().required(),
            avatar: Joi.string().trim().optional(),
            confirm_password: Joi.string().trim().allow('').optional(),
            password: Joi.string().trim().allow('').optional(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in profile validation function ',err)
        return res.status(422).json({err: 'Error occured in profile validation funtion ', error: err})
        
    }
}

export const avatar_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            avatar: Joi.string().trim().optional(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in avatar validation function ',err)
        return res.status(422).json({err: 'Error occured in avatar validation funtion ', error: err})
        
    }
}

export const new_user_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            last_name: Joi.string().trim().required(),
            first_name: Joi.string().trim().required(),
            title: Joi.string().trim().required(),
            email: Joi.string().trim().email().required(),
            is_admin: Joi.boolean().required(),
            is_active: Joi.boolean().optional(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in new users data validation function ',err)
        return res.status(422).json({err: 'Error occured in new users data validation funtion ', error: err})
        
    }
}

export const task_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            task_title: Joi.string().trim().required(),
            priority: Joi.string().trim().required(),
            cost: Joi.number().required(),
            stage: Joi.string().trim().required(),
            assets: Joi.array().items(Joi.object()).optional(),
            team: Joi.array().items(Joi.string()).required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in new task data validation function ',err)
        return res.status(422).json({err: 'Error occured in new task data validation funtion ', error: err})
        
    }
}

export const sub_task_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            title: Joi.string().trim().required(),
            tag: Joi.string().trim().required(),
            due_date: Joi.number().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in new sub task data validation function ',err)
        return res.status(422).json({err: 'Error occured in new sub task data validation funtion ', error: err})
        
    }
}

export const activity_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            activity_type: Joi.string().trim().required(),
            description: Joi.string().trim().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in new task activity data validation function ',err)
        return res.status(422).json({err: 'Error occured in new task activity data validation funtion ', error: err})
        
    }
}

export const payment_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            task_id: Joi.string().trim().required(),
            amount: Joi.number().required(),
            payer_name: Joi.string().trim().required(),
            payment_receipt: Joi.array().items(Joi.object()).optional(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in new payment data validation function ',err)
        return res.status(422).json({err: 'Error occured in new payment data validation funtion ', error: err})
        
    }
}

export const save_subscription_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            subscription: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()

    } catch (err:any) {
        console.log('Error occured while validating save subscription ',err)
        return res.status(422).json({err: 'Error occured while validating save subscription ', error: err})
    }
}