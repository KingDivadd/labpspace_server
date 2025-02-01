import { Request, Response, NextFunction } from "express"
import colors from 'colors';
require('colors')

const route_loggeR = (req: Request, res: Response, next: NextFunction): void => {
    console.log(`method : ${req.method}, route : ${req.url}`.magenta);
    
    next()
}

export default route_loggeR