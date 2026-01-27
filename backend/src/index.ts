import express from 'express';

import pipelineRoutes from './routes/Pipeline.routes.js'; 
import leadRoutes from './routes/Lead.routes.js'

const app = express();
app.use(express.json());

app.use('/pipeline', pipelineRoutes);
app.use('/leads', leadRoutes);
