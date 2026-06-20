import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { config } from '../config';

export const createCodeTest = async (req: AuthRequest, res: Response) => {
  const { title, pass_key, time_limit, problems } = req.body;

  try {
    const newTest = await prisma.code_tests.create({
      data: {
        title,
        pass_key,
        time_limit,
        instructor_id: req.user.id,
        created_at: new Date()
      }
    });

    if (problems && problems.length > 0) {
      const problemData = problems.map((p: any) => ({
        test_id: newTest.id,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        test_cases: p.test_cases
      }));
      await prisma.problems.createMany({ data: problemData });
    }

    const students = await prisma.users.findMany({ where: { role: 'STUDENT' } });
    const notificationsData = students.map((s: any) => ({
      user_id: s.id,
      title: 'New Code Arena!',
      message: `Challenge '${title}' is live. Test your skills now!`,
      created_at: new Date(),
      is_read: false
    }));

    if (notificationsData.length > 0) {
      await prisma.notifications.createMany({ data: notificationsData });
    }

    return res.json({ message: 'Test Created Successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const getCodeTests = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role === 'instructor') {
      const tests = await prisma.code_tests.findMany({ where: { instructor_id: req.user.id } });
      return res.json(tests);
    }

    const tests = await prisma.code_tests.findMany();
    const responseData = [];

    for (const t of tests) {
      const submission = await prisma.test_results.findFirst({
        where: { test_id: t.id, user_id: req.user.id }
      });

      if (!submission) {
        responseData.push({
          id: t.id,
          title: t.title,
          time_limit: t.time_limit,
          completed: false
        });
      }
    }

    return res.json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const startCodeTest = async (req: AuthRequest, res: Response) => {
  const testId = parseInt(req.params.test_id as string, 10);
  const pass_key = req.body.pass_key;

  try {
    const existingSubmission = await prisma.test_results.findFirst({
      where: { test_id: testId, user_id: req.user.id }
    });

    if (existingSubmission) {
      return res.status(403).json({ detail: 'Test already submitted.' });
    }

    const test = await prisma.code_tests.findUnique({
      where: { id: testId },
      include: { problems: true }
    });

    if (!test) return res.status(404).json({ detail: 'Test not found' });
    if (test.pass_key !== pass_key) return res.status(403).json({ detail: 'Invalid Key' });

    return res.json({
      id: test.id,
      title: test.title,
      time_limit: test.time_limit,
      problems: test.problems.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        test_cases: p.test_cases
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const submitTestResult = async (req: AuthRequest, res: Response) => {
  const { test_id, score, problems_solved, time_taken } = req.body;

  try {
    await prisma.test_results.create({
      data: {
        test_id,
        user_id: req.user.id,
        score,
        problems_solved,
        time_taken,
        submitted_at: new Date()
      }
    });

    return res.json({ message: 'Submitted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const getTestResults = async (req: AuthRequest, res: Response) => {
  const testId = parseInt(req.params.test_id as string, 10);

  try {
    const results = await prisma.test_results.findMany({
      where: { test_id: testId },
      include: { users: true }
    });

    const response = results.map((r: any) => ({
      student_name: r.users?.full_name,
      email: r.users?.email,
      score: r.score,
      problems_solved: r.problems_solved,
      time_taken: r.time_taken,
      submitted_at: r.submitted_at?.toISOString().replace('T', ' ').substring(0, 16)
    }));

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const executeCode = async (req: Request, res: Response) => {
  const { source_code, language_id, test_cases, stdin } = req.body;

  if (!config.awsLambdaUrl) {
    return res.status(500).json({ detail: 'Compiler Configuration Error (Missing AWS URL)' });
  }

  try {
    const response = await axios.post(config.awsLambdaUrl, {
      source_code,
      language_id: language_id || 71,
      test_cases,
      stdin: stdin || ""
    }, { timeout: 15000 });

    let data = response.data;
    if (data.body) {
      data = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
    }

    if (data.results && Array.isArray(data.results)) {
      let passedCount = 0;

      for (const resItem of data.results) {
        const rawActual = String(resItem.actual || "");
        const rawExpected = String(resItem.expected || "");

        const cleanActual = rawActual.trim();
        const cleanExpected = rawExpected.trim();

        resItem.actual = cleanActual;

        if (cleanActual === cleanExpected && cleanExpected !== "") {
          resItem.status = "Passed";
          passedCount++;
        } else {
          resItem.status = "Failed";
        }
      }

      if (data.stats) {
        data.stats.passed = passedCount;
      }
    }

    return res.json(data);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'ECONNABORTED') {
      return res.json({ error: 'Execution Timed Out (Server Limit)' });
    }
    return res.json({ error: `AWS Error: ${error.message}` });
  }
};
