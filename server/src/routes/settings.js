import { Router } from "express";
import { Settings } from "../models/Settings.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const SUPPORTED_LANGUAGES = ["en", "ko"];

router.get("/language", async (_request, response, next) => {
  try {
    const setting = await Settings.findOne({ key: "defaultLanguage" });
    response.json({ language: setting?.value ?? "en" });
  } catch (error) {
    next(error);
  }
});

router.put("/language", requireAuth, async (request, response, next) => {
  try {
    const { language } = request.body;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      response.status(400).json({
        message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}.`,
      });
      return;
    }

    await Settings.findOneAndUpdate(
      { key: "defaultLanguage" },
      { value: language },
      { upsert: true, new: true },
    );

    response.json({ language });
  } catch (error) {
    next(error);
  }
});

router.get("/contact", async (_request, response, next) => {
  try {
    const [emailSetting, githubSetting] = await Promise.all([
      Settings.findOne({ key: "contactEmail" }),
      Settings.findOne({ key: "contactGithub" }),
    ]);
    response.json({
      email: emailSetting?.value ?? "umaraliy092@gmail.com",
      github: githubSetting?.value ?? "https://github.com/aliy26",
    });
  } catch (error) {
    next(error);
  }
});

router.put("/contact", requireAuth, async (request, response, next) => {
  try {
    const { email, github } = request.body;

    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      response.status(400).json({ message: "Invalid email address." });
      return;
    }

    if (github !== undefined && !/^https?:\/\//.test(github)) {
      response.status(400).json({
        message: "GitHub must be a valid URL starting with http(s)://.",
      });
      return;
    }

    await Promise.all([
      email !== undefined
        ? Settings.findOneAndUpdate(
            { key: "contactEmail" },
            { value: email },
            { upsert: true, new: true },
          )
        : Promise.resolve(),
      github !== undefined
        ? Settings.findOneAndUpdate(
            { key: "contactGithub" },
            { value: github },
            { upsert: true, new: true },
          )
        : Promise.resolve(),
    ]);

    const [updatedEmail, updatedGithub] = await Promise.all([
      Settings.findOne({ key: "contactEmail" }),
      Settings.findOne({ key: "contactGithub" }),
    ]);

    response.json({
      email: updatedEmail?.value ?? "umaraliy092@gmail.com",
      github: updatedGithub?.value ?? "https://github.com/aliy26",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/hero-stats", async (_request, response, next) => {
  try {
    const [yearsSetting, buildsSetting] = await Promise.all([
      Settings.findOne({ key: "heroYears" }),
      Settings.findOne({ key: "heroBuilds" }),
    ]);
    response.json({
      years: yearsSetting?.value ?? "4",
      builds: buildsSetting?.value ?? "12",
    });
  } catch (error) {
    next(error);
  }
});

router.put("/hero-stats", requireAuth, async (request, response, next) => {
  try {
    const { years, builds } = request.body;

    if (years !== undefined && !String(years).trim()) {
      response.status(400).json({ message: "Years value cannot be empty." });
      return;
    }

    if (builds !== undefined && !String(builds).trim()) {
      response.status(400).json({ message: "Builds value cannot be empty." });
      return;
    }

    await Promise.all([
      years !== undefined
        ? Settings.findOneAndUpdate(
            { key: "heroYears" },
            { value: String(years).trim() },
            { upsert: true, new: true },
          )
        : Promise.resolve(),
      builds !== undefined
        ? Settings.findOneAndUpdate(
            { key: "heroBuilds" },
            { value: String(builds).trim() },
            { upsert: true, new: true },
          )
        : Promise.resolve(),
    ]);

    const [updatedYears, updatedBuilds] = await Promise.all([
      Settings.findOne({ key: "heroYears" }),
      Settings.findOne({ key: "heroBuilds" }),
    ]);

    response.json({
      years: updatedYears?.value ?? "4",
      builds: updatedBuilds?.value ?? "12",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
