"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");
const { testJobIds } = require("../models/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "Full Stack Engineer",
    salary: 120000,
    equity: "0.2",
    companyHandle: "c1"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post('/jobs')
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({job: {...newJob, id: expect.any(Number)}})
  })

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .post('/jobs')
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  })

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post('/jobs')
      .send({salary: 100000})
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toBe(400)
  })

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post('/jobs')
      .send({
        title: "Full Stack Engineer",
        salary: 'like, a lot man',
        equity: "0.2",
        companyHandle: "c1"
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get('/jobs');
    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({jobs: [{
      id: expect.any(Number),
      title: "J1",
      salary: 1,
      equity: "0.1",
      companyHandle: "c1"
    },
    {
      id: expect.any(Number),
      title: "J2",
      salary: 2,
      equity: "0.2",
      companyHandle: "c1"
    },
    {
      id: expect.any(Number),
      title: "J3",
      salary: 3,
      equity: null,
      companyHandle: "c1"
    }]})
  });

  test("fails: testing error handler", async function () {
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get('/jobs')
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toBe(500)
  })
})

describe("GET /jobs/:id", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`)
    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({job: {
      id: expect.any(Number),
      title: "J1",
      salary: 1,
      equity: "0.1",
      company: {
        handle: 'c1',
        name: 'C1',
        description: 'Desc1',
        numEmployees: 1,
        logoUrl: 'http://c1.img'
      }}
    });
  });

  test("throw NotFoundError for no such job", async function () {
    const resp = await request(app).get('/jobs/0')
    expect(resp.statusCode).toBe(404)
  })
})

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({title: 'J1, v2'})
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({job: {
      id: expect.any(Number),
      title: "J1, v2",
      salary: 1,
      equity: "0.1",
      companyHandle: 'c1'
    }})
  })

  test("unauth for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({title: 'I AM BAD ACTOR'})
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toBe(401)
  })

  test("job not found", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({title: 'In-House Philosopher'})
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toBe(404)
  })

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({salary: "It's a lot, just trust me"})
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toBe(400)
  })
})

describe("DELETE /jobs/:id", function () {
  test("works", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJobIds[0]}`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({deleted: testJobIds[0]})
  })

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
})