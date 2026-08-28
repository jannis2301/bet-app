import express from 'express';
import {
  downloadSeasonArchivePdf,
  getArchivedSeasons,
  getSeasonArchive,
} from '../controllers/archiveController.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);

router.route('/').get(getArchivedSeasons);
router.route('/:season').get(getSeasonArchive);
router.route('/:season/pdf').get(downloadSeasonArchivePdf);

export default router;
