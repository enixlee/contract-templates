import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

function base64Encode(str: string) {
  return ethers.encodeBase64(ethers.toUtf8Bytes(str));
}

function unicodeString(...args: any) {
  return args.join("");
}

function tokenURI() {
  const fillColor = "#135240";

  // Create SVG rectangle with color
  const imgSVG = base64Encode(
    "<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.com/svgjs' width='500' height='500' preserveAspectRatio='none' viewBox='0 0 500 500'>" +
      "<rect width='100%' height='100%' fill='" +
      fillColor +
      "' />" +
      "<text x='50%' y='50%' font-size='128' dominant-baseline='middle' text-anchor='middle'>" +
      unicodeString("😀") +
      "</text>" +
      "</svg>"
  );

  const json = base64Encode(
    '{"name": "ETH Watching SVG",' +
      '"description": "An Automated ETH tracking SVG",' +
      '"image": "data:image/svg+xml;base64,' +
      imgSVG +
      '"}'
  );

  const finalTokenURI = unicodeString("data:application/json;base64,", json);

  return finalTokenURI;
}

describe("Greeter", function () {
  let contract: Contract;

  const SET_GREETING_ROLE = ethers.solidityPackedKeccak256(
    ["string"],
    ["SET_GREETING_ROLE"]
  );

  beforeEach(async () => {
    const Greeter = await ethers.getContractFactory("Greeter");
    contract = await upgrades.deployProxy(Greeter, ["Hello, world!"]);
    await contract.waitForDeployment();
  });

  it("Should get role to set greeting", async function () {
    const [owner, signer2] = await ethers.getSigners();

    await contract.connect(owner).setGreeting("it's ok!");

    expect(await contract.greet()).to.equal("it's ok!");

    await expect(contract.connect(signer2).setGreeting("it's ok!"))
      .to.be.revertedWithCustomError(
        contract,
        "AccessControlUnauthorizedAccount"
      )
      .withArgs(signer2.address, SET_GREETING_ROLE);
  });

  it("Should return the new greeting once it's changed", async function () {
    await contract.setGreeting("Hello, world!");
    expect(await contract.greet()).to.equal("Hello, world!");

    const [owner] = await ethers.getSigners();
    await expect(contract.connect(owner).setGreeting("Hola, mundo!"))
      .to.emit(contract, "GreetingChanged")
      .withArgs(owner.address, "Hola, mundo!");

    expect(await contract.greet()).to.equal("Hola, mundo!");

    const setGreetingTx = await contract.setGreeting("Hello, world!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await contract.greet()).to.equal("Hello, world!");
  });

  it("Should pause contract", async function () {
    await contract.pause();

    await expect(
      contract.setGreeting("Hola, mundo!")
    ).to.be.revertedWithCustomError(contract, "EnforcedPause");
  });

  it("Greeter:tokenURI", async () => {
    const tokenUri = tokenURI();

    await expect(contract.tokenURI())
      .to.be.emit(contract, "BuildTokenUri")
      .withArgs(tokenUri);
  });

  it("Greeter:Gen Hash", async () => {
    const base = "what's osairo???";

    const hash = ethers.keccak256(ethers.toUtf8Bytes(base));

    console.log("Hash:", hash);
  });
});
