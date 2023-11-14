import { NextApiRequest, NextApiResponse } from "next";
import authenticate from "../checkToken";
import { dataVerifyUnit } from "@/types/verify";
import { handleAddUnit } from "./service";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === "GET") {
        //   GET(req, res);
    } else if (req.method === "POST") {
        POST(req, res);
    } else if (req.method === "PUT") {
        //   PUT(req, res);
    } else if (req.method === "DELETE") {
        //   DELETE(req, res);
    } else {
        res.status(405).end();
    }
};

const POST = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const body: dataVerifyUnit = await req.body;
        // Verify/Add Unit
        return await handleAddUnit(body, res);
    } catch (error: unknown) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", status: false });
    }
};