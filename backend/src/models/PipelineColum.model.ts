import { model, Schema, Document, Model } from 'mongoose';


export interface IPipelineColumn extends Document {
  nome: string;
  ordem: number;
  SLA: number;
}


const PipelineColumnSchema: Schema = new Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome da coluna é obrigatório.'],
      trim: true,
    },
    ordem: {
      type: Number,
      required: [true, 'A ordem da coluna é obrigatória.'],
    },
    SLA: {
      type: Number,
      required: [true, 'O SLA (em dias/horas) é obrigatório.'],
      min: [0, 'O SLA não pode ser negativo.'],
    },

   
  },
  {
    timestamps: true,
  }
);


const PipelineColumn: Model<IPipelineColumn> = model<IPipelineColumn>(
  'PipelineColumn', 
  PipelineColumnSchema
);

export default PipelineColumn;