import detectEthereumProvider from "@metamask/detect-provider";
import { Strategy, ZkIdentity } from "@zk-kit/identity";
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols";
import Head from "next/head";
import React, { useState } from "react";
import styles from "../styles/Home.module.css";
import TextField from "@mui/material/TextField";
import { useFormik } from "formik";
import * as Yup from "yup";
import Greeter from "artifacts/contracts/Greeters.sol/Greeters.json";
import TextBox from "./textbox"; 
import { providers } from "ethers";

export default function Home() {
  
  const [logs, setLogs] = React.useState("Connect your wallet and greet!");


  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required("Fullname is required")
      .min(6, "Name must be at least 6 characters")
      .max(20, "Name must not exceed 20 characters"),
    age: Yup.number().required("Age is required"),
    address: Yup.string().required("Address is required"),
  });
  const formik = useFormik({
    initialValues: { name: "", age: "", address: "" },
    validationSchema,
    onSubmit: (data: any) => {
      console.log(JSON.stringify(data, null, 2));
      greet();
    },
  });

  async function greet() {
    setLogs("Creating your Semaphore identity...");

    const provider = (await detectEthereumProvider()) as any;

    await provider.request({ method: "eth_requestAccounts" });

    const ethersProvider = new providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const message = await signer.signMessage(
      "Sign this message to create your identity!"
    );

    const identity = new ZkIdentity(Strategy.MESSAGE, message);
    const identityCommitment = identity.genIdentityCommitment();
    const identityCommitments = await (
      await fetch("./identityCommitments.json")
    ).json();

    const merkleProof = generateMerkleProof(
      20,
      BigInt(0),
      identityCommitments,
      identityCommitment
    );

    setLogs("Creating your Semaphore proof...");

    const greeting = "Hello world";

    const witness = Semaphore.genWitness(
      identity.getTrapdoor(),
      identity.getNullifier(),
      merkleProof,
      merkleProof.root,
      greeting
    );

    const { proof, publicSignals } = await Semaphore.genProof(
      witness,
      "./semaphore.wasm",
      "./semaphore_final.zkey"
    );
    const solidityProof = Semaphore.packToSolidityProof(proof);

    const response = await fetch("/api/greet", {
      method: "POST",
      body: JSON.stringify({
        greeting,
        nullifierHash: publicSignals.nullifierHash,
        solidityProof: solidityProof,
      }),
    });

    if (response.status === 500) {
      const errorMessage = await response.text();

      setLogs(errorMessage);
    } else {
      setLogs("Your anonymous greeting is onchain :)");
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Greetings</title>
        <meta
          name="description"
          content="A simple Next.js/Hardhat privacy application with Semaphore."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Greetings</h1>

        <p className={styles.description}>
          A simple Next.js/Hardhat privacy application with Semaphore.
        </p>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            id="name"
            color="warning"
            label="Name"
            focused
            name="name"
            style={{ margin: 30 }}
            onChange={formik.handleChange}
            value={formik.values.name}
          />
          <div style={{ color: "red" }}>
            {formik.errors.name ? formik.errors.name : null}
          </div>
          <TextField
            id="age"
            color="warning"
            label="age"
            name="age"
            focused
            style={{ margin: 30 }}
            onChange={formik.handleChange}
            value={formik.values.age}
          />
          <div style={{ color: "red" }}>
            {formik.errors.age ? formik.errors.age : null}
          </div>
          <TextField
            id="address"
            name="address"
            color="warning"
            label="Address"
            focused
            style={{ margin: 30 }}
            onChange={formik.handleChange}
            value={formik.values.address}
          />
          <div>
          <TextBox value={"emiting event here"}/>
          </div>
          <div style={{ color: "red" }}>
            {formik.errors.address ? formik.errors.address : null}
          </div>
          <div className={styles.logs}>{logs}</div>

          <button type="submit" className={styles.button}>
            Greet
          </button>
        </form>
      </main>
    </div>
  );
}
