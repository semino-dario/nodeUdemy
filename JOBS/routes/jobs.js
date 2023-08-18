const express = require('express');
const router = express.Router();
const { getJobs, newJob, getJobsInRadius, updateJob, deleteJob, getJob, applyJob } = require('../controllers/controllers')

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');


router.route('/jobs').get(getJobs) // get all jobs

router.route('/job/:id/:slug').get(getJob) // get one particular job

router.route('/jobs/:zipcode/:distance').get(getJobsInRadius)

router.route('/job/new').post(isAuthenticatedUser, authorizeRoles('employeer', 'admin'), newJob)

router.route('/job/:id/apply').put(isAuthenticatedUser, authorizeRoles('user'), applyJob)


router.route('/job/:id')
    .put(isAuthenticatedUser, authorizeRoles('employeer', 'admin'), updateJob)
    .delete(isAuthenticatedUser, authorizeRoles('employeer', 'admin'), deleteJob)


module.exports = router; 