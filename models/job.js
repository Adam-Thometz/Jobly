"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * */
  static async create(data) {
    const result = await db.query(`
          INSERT INTO jobs (title, salary, equity, company_handle)
          VALUES ($1, $2, $3, $4)
          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`, 
        [
          data.title,
          data.salary,
          data.equity,
          data.companyHandle
    ]);
    const job = result.rows[0];

    return job;
  }
  /** Find all jobs.
   * 
   * Includes filters for title, minSalary, and hasEquity
   * 
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */
  static async findAll(searchFilters = {}) {
    let query = 'SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs'
    let whereStatement = []
    let values = []
    const {title, minSalary, hasEquity} = searchFilters

    if (!!title) {
      values.push(`%${title}%`)
      whereStatement.push(`title ILIKE $${values.length}`)
    }
    if (!!minSalary) {
      values.push(minSalary)
      whereStatement.push(`salary >= $${values.length}`)
    }
    if (hasEquity){
      whereStatement.push(`equity IS NOT NULL`)
    }
    if (whereStatement.length > 0) {
      query += ` WHERE ${whereStatement.join(" AND ")}`
    }
    const jobsRes = await db.query(query, values);
    const jobs = jobsRes.rows;
    return jobs;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { id, title, salary, equity, company }
   *   where company is [{ handle, name, description, numEmployees, logoUrl }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const jobRes = await db.query(`
      SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id = $1  
    `, [id]);

    const job = jobRes.rows[0]

    if (!job) throw new NotFoundError(`No job found with id ${id}`)

    const companyRes = await db.query(`
      SELECT handle,
             name,
             description,
             num_employees AS "numEmployees",
             logo_url AS "logoUrl" 
      FROM companies
      WHERE handle = $1`, [job.companyHandle])

    delete job.companyHandle
    job.company = companyRes.rows[0]

    return job;
  }
  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all 
   * the fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {handle, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {})
    const idVarIdx = "$" + (values.length + 1)
    const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const results = await db.query(querySql, [...values, id])
    const job = results.rows[0]

    if (!job) throw new NotFoundError(`No job found with id ${id}`)

    return job
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/
  static async remove(id) {
    const result = await db.query(`
      DELETE FROM jobs
      WHERE id = $1
      RETURNING id`, [id])
    const job = result.rows[0]

    if (!job) throw new NotFoundError(`No job with id ${id}`)
  }
}

module.exports = Job