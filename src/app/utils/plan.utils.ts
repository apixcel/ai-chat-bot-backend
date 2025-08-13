import prisma from "../lib/prisma";

export const freePlanId = "dd583a7d-2a28-4610-9ce3-b0875362dbe8";

export const basicPlan = async () => {
  const isExist = await prisma.plan.findFirst({
    where: {
      price: 0,
    },
  });

  if (!isExist) {
    await prisma.plan.create({
      data: {
        id: freePlanId,
        appLimit: 1,
        customization: false,
        durationMonths: 1,
        trialPeriodDays: 0,
        name: "Basic Plan",
        price: 0,
        isActive: true,
      },
    });
  }
};

const planSeed = async () => {
  await basicPlan();
};

export default planSeed;
