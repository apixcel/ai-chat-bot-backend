const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const moduleName = args[0];
const controllerMethodIndex = args.indexOf("-c");
const methodName = controllerMethodIndex !== -1 ? args[controllerMethodIndex + 1] : "test";

if (!moduleName) {
  console.error(
    "❌ Please provide a module name. Example: node createservice.js auth [-c getUser]"
  );
  process.exit(1);
}

const moduleFolder = path.join(__dirname, "src", "app", "modules", moduleName);

if (fs.existsSync(moduleFolder)) {
  console.error(`❌ Module "${moduleName}" already exists.`);
  process.exit(1);
}

fs.mkdirSync(moduleFolder, { recursive: true });

const controllerName = `${moduleName}Controller`;

const files = [
  {
    name: `${moduleName}.controller.ts`,
    content: `import catchAsyncError from "../../utils/catchAsync";

const ${methodName} = catchAsyncError(async (req, res) => {
  // your logic here
});

const ${controllerName} = { ${methodName} };

export default ${controllerName};
`,
  },
  {
    name: `${moduleName}.service.ts`,
    content: `// ${moduleName}.service.ts

// Add service logic here
`,
  },
  {
    name: `${moduleName}.interface.ts`,
    content: "",
  },
  {
    name: `${moduleName}.validation.ts`,
    content: "",
  },
  {
    name: `${moduleName}.route.ts`,
    content: `import { Router } from "express";
import ${controllerName} from "./${moduleName}.controller";

const router = Router();

router.post("/${methodName}", ${controllerName}.${methodName});

const ${moduleName}Route = router;
export default ${moduleName}Route;
`,
  },
];

// Write files
files.forEach((file) => {
  const filePath = path.join(moduleFolder, file.name);
  fs.writeFileSync(filePath, file.content);
  console.log(`✅ Created: ${filePath}`);
});
