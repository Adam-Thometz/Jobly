"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    companyHandle: 'c1',
    title: "DevOps Engineer",
    salary: 80000,
    equity: '0.1'
  };
  
  test("works", async function () {
    let job = await Job.create(newJob)
    expect(job).toEqual({...newJob, id: expect.any(Number)})
  });
})

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        title: "Software Engineer",
        salary: 107000,
        equity: "0.33",
        companyHandle: 'c1',
        id: expect.any(Number)
      },
      {
        title: "UX Designer",
        salary: 90000,
        equity: "0.33",
        companyHandle: 'c2',
        id: expect.any(Number)
      },
      {
        title: "Data Scientist",
        salary: 110000,
        equity: null,
        companyHandle: 'c1',
        id: expect.any(Number)
      }
    ]);
  });
  test("works: title filter", async function () {
    let jobs = await Job.findAll({title: "UX"})
    expect(jobs).toEqual([
      {
        title: "UX Designer",
        salary: 90000,
        equity: "0.33",
        companyHandle: 'c2',
        id: expect.any(Number)
      }
    ]);
  })
  test("works: minSalary filter", async function () {
    let jobs = await Job.findAll({minSalary: 100000})
    expect(jobs).toEqual([
      {
        title: "Software Engineer",
        salary: 107000,
        equity: "0.33",
        companyHandle: 'c1',
        id: expect.any(Number)
      },
      {
        title: "Data Scientist",
        salary: 110000,
        equity: null,
        companyHandle: 'c1',
        id: expect.any(Number)
      }
    ]);
  })
  test("works: hasEquity filter", async function () {
    let jobs = await Job.findAll({hasEquity: true})
    expect(jobs).toEqual([
      {
        title: "Software Engineer",
        salary: 107000,
        equity: "0.33",
        companyHandle: 'c1',
        id: expect.any(Number)
      },
      {
        title: "UX Designer",
        salary: 90000,
        equity: "0.33",
        companyHandle: 'c2',
        id: expect.any(Number)
      }
    ]);
  })
  test("works: two filters", async function () {
    let jobs = await Job.findAll({minSalary: 100000, hasEquity: true})
    expect(jobs).toEqual([
      {
        title: "Software Engineer",
        salary: 107000,
        equity: "0.33",
        companyHandle: 'c1',
        id: expect.any(Number)
      }
    ]);
  })
})

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testJobIds[0])
    expect(job).toEqual({
      title: "Software Engineer",
      salary: 107000,
      equity: "0.33",
      id: expect.any(Number),
      company: {
        handle: 'c1',
        name: 'C1',
        numEmployees: 1,
        description: 'Desc1',
        logoUrl: 'http://c1.img'
      }
    })
  })

  test("throws 404 if job not found", async function () {
    try {
      await Job.get(999)
    } catch(err) {
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })
})

describe("update", function () {
  const newData = {
    title: "Data Engineer",
    salary: 100000,
    equity: "0.3"
  }
  test('works', async function () {
    let job = await Job.update(testJobIds[2], newData)
    expect(job).toEqual({
      id: testJobIds[2],
      companyHandle: 'c1',
      ...newData
    })
  })
  test("throws NotFoundError if job not found", async function () {
    try {
      await Job.update(999, {title: "You can't catch this job!"})
    } catch(err) {
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })
  test("throws BadRequestError if no data is given", async function () {
    try {
      await Job.update(testJobIds[0], {})
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy()
    }
  })
})

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJobIds[2])
    const res = await db.query(`
      SELECT id FROM jobs WHERE id = $1
    `, [testJobIds[2]])
    expect(res.rows.length).toEqual(0)
  })
  test("throws NotFoundError if job not found", async function () {
    try {
      await Job.remove(999)
    } catch(err) {
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })
})