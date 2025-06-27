const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;

// --- Configuration ---
const foundryDevRoot = path.resolve(__dirname, '../context/foundry_dev');
const planReviewPath = path.join(foundryDevRoot, '4-PlanReview');
const promptsOutputPath = path.resolve(__dirname, './prompts');

// --- Helper Functions ---

/**
 * Parses a plan filename to extract metadata.
 * Example: r5_dev1_story_34_plan.md -> { round: '5', dev: '1', story: '34' }
 */
function parsePlanFilename(filename) {
  const match = filename.match(/r(\d+)_dev(\d+)_story_(\d+)/);
  if (!match) return null;
  return {
    round: match[1],
    dev: match[2],
    story: match[3],
  };
}

/**
 * Assembles the master prompt for the PM review.
 */
async function assembleMasterPrompt(metadata, planContent) {
  const { dev, story } = metadata;

  // 1. Read all the context files
  const roleGuidePath = path.join(foundryDevRoot, `ROLE_GUIDE_PM.md`);
  const checklistPath = path.join(foundryDevRoot, `PM-ROUND-CHECKLIST.md`);
  const storyPath = path.join(foundryDevRoot, '3-Stories', `r${metadata.round}_dev${dev}_story_${story}_description.md`);

  try {
    const roleGuideContent = await fs.readFile(roleGuidePath, 'utf8');
    const checklistContent = await fs.readFile(checklistPath, 'utf8');
    const storyContent = await fs.readFile(storyPath, 'utf8');

    // 2. Construct the prompt
    const masterPrompt = `
      You are PM${dev}, an expert Product Manager for a software team. Your role and responsibilities are defined in this guide:
      --- ROLE GUIDE ---
      ${roleGuideContent}
      --- END ROLE GUIDE ---

      You are reviewing a developer's implementation plan. You must use the following checklist to ensure quality:
      --- CHECKLIST ---
      ${checklistContent}
      --- END CHECKLIST ---

      Here is the original story that you wrote for the developer:
      --- ORIGINAL STORY ---
      ${storyContent}
      --- END ORIGINAL STORY ---

      Here is the developer's implementation plan that you must now review:
      --- DEV PLAN ---
      ${planContent}
      --- END DEV PLAN ---

      Please perform the review. Adhere strictly to your role and the provided checklists. Provide your response in the required format (APPROVED/CHANGES REQUESTED/REJECTED) and nothing else.
    `;

    return masterPrompt;

  } catch (error) {
    console.error(`[Assembler] Error reading context files:`, error);
    return null;
  }
}

// --- Main Watcher Logic ---

console.log(`[Watcher] Initializing...`);
console.log(`[Watcher] Watching for new plans in: ${planReviewPath}`);

const watcher = chokidar.watch(planReviewPath, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
});

watcher.on('add', async (filePath) => {
  console.log(`[Watcher] New file detected: ${filePath}`);
  const filename = path.basename(filePath);

  const metadata = parsePlanFilename(filename);
  if (!metadata) {
    console.warn(`[Watcher] Could not parse filename: ${filename}. Skipping.`);
    return;
  }

  console.log(`[Action] Plan for Story #${metadata.story} (Dev${metadata.dev}) is ready for review.`);

  try {
    // 1. Read the content of the new plan file
    const planContent = await fs.readFile(filePath, 'utf8');

    // 2. Assemble the master prompt
    console.log(`[Assembler] Assembling master prompt...`);
    const masterPrompt = await assembleMasterPrompt(metadata, planContent);

    if (masterPrompt) {
      // 3. Save the generated prompt to a file for debugging
      const outputFilename = `prompt_r${metadata.round}_story_${metadata.story}.txt`;
      const outputPath = path.join(promptsOutputPath, outputFilename);
      await fs.writeFile(outputPath, masterPrompt);
      console.log(`[Assembler] Master prompt saved to: ${outputPath}`);
      console.log(`[Next Step] The prompt is ready to be sent to an LLM.`);
    }

  } catch (error) {
    console.error(`[Watcher] Error processing file ${filePath}:`, error);
  }
});

console.log('[Watcher] Ready and waiting for changes.');