import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import CreativeAdaptationService from '../services/CreativeAdaptationService.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error('Only PNG and JPG creatives are supported'));
  },
});

router.use(authMiddleware);

router.use((req, res, next) => {
  req.adaptationService = new CreativeAdaptationService(
    req.app.locals.providers?.db,
    req.app.locals.providers?.storage,
  );
  next();
});

router.post('/', upload.single('source_image'), async (req, res) => {
  try {
    const project = await req.adaptationService.createProjectFromUpload({
      ownerId: req.user.id,
      projectName: req.body?.name,
      file: req.file,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await req.adaptationService.listProjects(
      req.user.id,
      { status },
      { page: Number.parseInt(page, 10), limit: Number.parseInt(limit, 10) },
    );

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: Number.parseInt(page, 10),
        limit: Number.parseInt(limit, 10),
        total: result.count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await req.adaptationService.getProjectById(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Adaptation project not found',
      });
    }

    return res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id/setup', async (req, res) => {
  try {
    const project = await req.adaptationService.saveProjectSetup(req.params.id, req.user.id, req.body);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Adaptation project not found',
      });
    }

    return res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.use((error, req, res, next) => {
  if (error?.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: error.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 15MB.'
        : error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  return next();
});

export default router;
