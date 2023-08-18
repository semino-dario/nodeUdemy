const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
const geoCoder = require('../utils/geoCoder')

const jobSchema = new mongoose.Schema({

    title: {
        type: String,
        required: [true, 'Please enter job title'],
        trim: true,
        maxLength: [100, 'job title cannot exceed 100 characteres']
    },
    slug: String,
    description: {
        type: String,
        required: [true, 'Please enter job description'],
        maxLength: [1000, 'job description cannot exceed 1000 characteres']
    },

    email: {
        type: String,
        validate: [validator.isEmail, 'Please add a valid email address']
    },

    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        },
        formattedAddress: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },

    address: {
        type: String,
        required: [true, 'Please add address']
    },
    company: {
        type: String,
        required: [true, 'Please add company name']
    },
    industry: {
        type: [String],
        required: [true, 'Please enter industry for this job'],
        enum: {
            values: ['Busines', 'Information Technology', 'Banking', 'Education/training', 'Telecomunication', 'Others'],
            message: 'Please select correct options for industry'
        }
    },

    jobType: {
        type: String,
        required: [true, 'Please enter job type'],
        enum: {
            values: [
                'Permanent',
                'Temporary',
                'Internship'
            ],
            message: 'Please select correct options for job type'
        }
    },
    minEducation: {
        type: String,
        required: [true, 'Please enter education level'],
        enum: {
            values: [
                'Bachelors',
                'Masters',
                'PHD'
            ],
            message: 'Please select correct options for education'
        }
    },
    positions: {
        type: Number,
        default: 1
    },

    experience: {
        type: String,
        required: [true, 'Please enter experience required for this job'],
        enum: [
            'No experience',
            '1 Year - 2 years',
            '2 years - 5 years',
            '5 years+'
        ],
        message: 'Please select correct options for experience'
    },
    salary: {
        type: Number,
        required: [true, 'Please enter expected salary for this job']
    },
    PostingDate: {
        type: Date,
        default: Date.now
    },

    lastDate: {
        type: Date,
        default: new Date().setDate(new Date().getDate() + 7)
    },
    applicantsApplied: {
        type: [Object],
        select: false
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
})

//Creating job slug before saving

jobSchema.pre('save', function (next) {
    //Creating slug before saving into db
    this.slug = slugify(this.title, { lower: true })

    next();
});

//Setting un location

jobSchema.pre('save', async function (next) {
    const loc = await geoCoder.geocode(this.address)

    this.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode
    }
}

)

module.exports = mongoose.model('Job', jobSchema)