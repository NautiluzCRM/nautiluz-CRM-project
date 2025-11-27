import express from 'express';

import pipelineRoutes from './routes/Pipeline.routes'; 
import leadRoutes from './routes/Lead.routes'

const app = express();
app.use(express.json());

app.use('/pipeline', pipelineRoutes);
app.use('/leads', leadRoutes);
