import { Request, Response, NextFunction } from "express"

const not_found = (req: Request, res: Response, next: NextFunction): void => {
    console.log('Page not found, check url or request type');
    
    res.status(404).json({ err: "Page not found, check url and try again" })
    next()
}

export default not_found