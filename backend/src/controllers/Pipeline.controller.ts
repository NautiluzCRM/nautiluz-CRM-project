import { Response , Request} from 'express';
import PipelineColumn from '../models/PipelineColum.model';

export const getPipelineData = async(req: Request, res: Response) => {
    try{
        const pipeline = await PipelineColumn.aggregate([
            {
                $sort : {ordem : 1},
            },
            {
                $lookup: {
                    from: 'leads',
                    localField: '_id',
                    foreignField: 'columId',
                    as: 'leads',
                }
            },
        ])
        res.status(200).json(pipeline)
    }catch(error){
        res.status(500).json({ message: 'Erro ao buscar dados do pipeline.', error });
    }
}
