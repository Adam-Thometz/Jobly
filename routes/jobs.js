"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");

const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { id, title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({job})
  } catch (err) {
    return next(err)
  }
})

/** GET / => {jobs: [{id, title, salary, equity, companyHandle}, ...]}
 * 
 * Can filter on the provided search filters:
 * - title
 * - minSalary
 * - hasEquity
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.get("/", async function (req, res, next) {
  const q = req.query
  if (!!q.minSalary) q.minSalary = +q.minSalary
  try {
    const jobs = await Job.findAll(q)
    return res.json({jobs: jobs})
  } catch (err) {
    return next(err)
  }
})

/** GET /:id  =>  { job }
 *
 *  Job is { id, title, salary, equity, company }
 *   where company is [{ handle, name, description, numEmployees, logoUrl }, ...]
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id)
    return res.json({job})
  } catch (err) {
    return next(err)
  }
})

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema)
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack)
      throw new BadRequestError(errs)
    }

    const job = await Job.update(req.params.id, req.body)
    return res.json({job})
  } catch (err) {
    return next(err)
  }
})

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */
  
router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id)
    return res.json({deleted: +req.params.id})
  } catch (err) {
    return next(err)
  }
})

module.exports = router