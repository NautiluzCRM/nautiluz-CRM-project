import {Response, Request} from 'express'

export const putLeadData = async (req: Request, res: Response) => {
    try{
        const{id} = req.params;
        const{columId} = req.body;
        
        if(!columId){
            return res.status(400).json({message: "O ID da nova coluna (columnId) é obrigatório"})
        }
        

    }catch{
        return res.status(500).json({message: "Erro ao mover o lead."})
    }

}