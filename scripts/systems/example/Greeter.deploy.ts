import { EonDeploy } from "../../deploy/eon-deploy.class";

async function main() {
  const deployer = new EonDeploy();
  const contract = await deployer.deployUpgradeWithData("Greeter", [
    "Hello, world!",
  ]);
  console.log("deployed to:", contract.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
