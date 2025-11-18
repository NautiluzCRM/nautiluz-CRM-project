import express from 'express';

import pipelineRoutes from './routes/Pipeline.routes'; 

const app = express();
app.use(express.json());

app.use('/pipeline', pipelineRoutes);

