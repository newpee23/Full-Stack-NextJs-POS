import { NextApiRequest, NextApiResponse } from "next";
import { typeNumber } from "@/utils/utils";
import { handleGetOptionProduct } from "./service";
import authenticate from "../checkToken";

export default authenticate(async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { query } = req;
        // getOption By companyId
        if(query.companyId) return await handleGetOptionProduct(res, typeNumber(query.companyId));

        return res.status(404).json({ message: [{message: "ไม่พบข้อมูลรหัสบริษัท"}], optionEmployee: "", status: false });
    } catch (error: unknown) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", optionEmployee: "", status: false });
    } 
});