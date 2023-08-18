const jobs = require('../models/jobs')
const Job = require('../models/jobs')
const geoCoder = require('../utils/geoCoder')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const APIFilters = require('../utils/APIFilters');
const path = require('path')
const fs = require('fs');


// Get all jobs => /api/v1/jobs
exports.getJobs = catchAsyncErrors(async (req, res, next) => {
    const apiFilters = new APIFilters(Job.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    // .searchByQuery();


    const jobs = await apiFilters.query;

    res.status(200).json({
        success: true,
        results: jobs.length,
        data: jobs
    }
    )
})

// Create new Job => /api/v1/job/new
exports.newJob = catchAsyncErrors(async (req, res, next) => {

    // Adding user to body
    req.body.user = req.user.id;

    const job = await Job.create(req.body);

    res.status(200).json({
        success: true,
        message: 'job created',
        data: job
    })
})

// Update a job => api/v1/job/:id
exports.updateJob = catchAsyncErrors(async (req, res, next) => {
    let job = await Job.findById(req.params.id)

    if (!job) {
        return next(new ErrorHandler('Job not found', 400))
    }

    //Check if the user is owner

    if (job.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorHandler(`User ${req.user.id} is not allowed to update this job`))
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(200).json(
        {
            success: true,
            message: 'job is updated',
            data: job
        }
    )
})

// Get a single job with ID and Slug => /api/v1/job/:id/:slug

exports.getJob = catchAsyncErrors(async (req, res, next) => {
    const job = await Job.find({ $and: [{ _id: req.params.id }, { slug: req.params.slug }] }).populate({
        path: 'user',
        select: 'name'

    });

    if (!job || job.length === 0) {
        return next(new ErrorHandler('Job not found', 400))

    }

    res.status(200).json(
        {
            success: true,
            data: job
        }
    )
})

// delete a job => api/v1/job/:id
exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
    let job = await Job.findById(req.params.id).select('+applicantsApplied')

    if (!job) {
        return next(new ErrorHandler('Job not found', 400))
    }

    if (job.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorHandler(`User ${req.user.id} is not allowed to delete this job`))
    }

    //Delete files associeted with the job

    for (let i = 0; i < job.applicantsApplied.length; i++) {
        let filepath = `/Users/dariosemino/nodeUdemy/JOBS/public/uploads/${job.applicantsApplied[i].resume}`

        fs.unlink(filepath, err => {
            if (err) return console.log(err)
        })
    }


    job = await Job.findByIdAndDelete(req.params.id);

    res.status(200).json(
        {
            success: true,
            message: "job deleted"
        }
    )
})

//Search jobs with radius => /api/v1/jobs/:zipcode/:distance
exports.getJobsInRadius = catchAsyncErrors(async (req, res, next) => {

    const { zipcode, distance } = req.params;

    // getting latitude and longitude from geocoder with zipcode

    const loc = await geoCoder.geocode(zipcode);
    const latitude = loc[0].latitude;
    const longitude = loc[0].longitude;
    const radius = distance / 3963;

    const jobs = await Job.find({
        location: { $geoWithin: { $centerSphere: [[longitude, latitude], radius] } }
    })

    res.status(200).json({
        success: true,
        results: jobs.length,
        data: jobs

    }

    )
});

//Apply to a job using resume => /api/v1/job/:id/apply

exports.applyJob = catchAsyncErrors(async (req, res, next) => {
    let job = await Job.findById(req.params.id).select('+applicantsApplied');

    if (!job) {
        return next(new ErrorHandler('Job not found.', 404))
    }

    //Check if job last date has been passed or not

    if (!job.lastDate < Date(Date.now())) {
        return next(new ErrorHandler('You cannot apply to this job. Date is over', 400))
    }

    //Check if the user has already applied for the job

    for (let i = 0; i < job.applicantsApplied.length; i++) {
        if (job.applicantsApplied[i].id === req.user.id) {
            return next(new ErrorHandler("Already applied for this job", 400))
        }
    }

    //Chech the file
    if (!req.files) {
        return next(new ErrorHandler("Please upload file.", 400))
    }

    const file = req.files.undefined;

    //Check file type
    const supportedFiles = /.docx|.pdf/;
    if (!supportedFiles.test(path.extname(file.name))) {
        return next(new ErrorHandler("Please upload document file", 400))
    }


    //Check file size

    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler(`File size shoud be less than ${process.env.MAX_FILE_SIZE}`, 400))
    }


    //Rename resume

    file.name = `${req.user.name.replace(' ', '_')}_${job._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.log(err)
            return next(new ErrorHandler('Resume upload failed', 500))
        }

        await Job.findByIdAndUpdate(req.params.id, {
            $push: {
                applicantsApplied: {
                    id: req.user.id,
                    resume: file.name
                }
            }
        },
            {
                new: true,
                runValidators: true,
                useFindAndModify: false
            });

        res.status(200).json({
            success: true,
            message: 'Applied to job successfully',
            data: file.name
        })
    })
})