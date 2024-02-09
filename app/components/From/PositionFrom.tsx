import { useAppDispatch } from "@/app/store/store";
import { Col, Form, Input, Row, Select, Skeleton, message } from "antd";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react"
import SaveBtn from "../UI/btn/SaveBtn";
import ProgressBar from "../UI/loading/ProgressBar";
import { optionStatus, validateWhitespace } from "./validate/validate";
import DrawerActionData from "../DrawerActionData";
import { setLoading } from "@/app/store/slices/loadingSlice";
import { useAddDataPosition, useSelectOpPosition, useUpdateDataPosition } from "@/app/api/position";
import { DataTypePosition } from "@/types/columns";
import ErrPage from "../ErrPage";
import SelectCompany from "../UI/select/SelectCompany";

interface Props {
    onClick: () => void;
    editData?: DataTypePosition;
    title: string;
    statusAction: "add" | "update";
};

interface positionSubmit {
    name: string;
    salary: string;
    company: number | undefined;
    status: string;
}

const PositionFrom = ({ onClick, statusAction, title, editData }: Props) => {
    const dispatch = useAppDispatch();
    const { data: session } = useSession();
    const { data, isLoading, isError, refetch, remove } = useSelectOpPosition(session?.user.accessToken, session?.user.company_id);
    const [messageApi, contextHolder] = message.useMessage();
    const addDataPositionMutation = useAddDataPosition();
    const updateDataPositionMutation = useUpdateDataPosition();
    const [messageError, setMessageError] = useState<{ message: string }[]>([]);
    const [loadingQuery, setLoadingQuery] = useState<number>(0);
    const [formValues, setFormValues] = useState<positionSubmit>({
        name: "",
        salary: "",
        company: undefined,
        status: "Active",
    });

    const showMessage = ({ status, text }: { status: string, text: string }) => {
        if (status === "success") { messageApi.success(text); }
        else if (status === "error") { messageApi.error(text); }
        else if (status === "warning") { messageApi.warning(text); }
    };

    const resetForm = () => {
        if (statusAction === "update") {
            if (editData?.key) {
                setFormValues({
                    name: editData.name,
                    salary: editData.salary.toString(),
                    status: editData.status,
                    company: editData.companyId
                });
            }
            if (messageError.length > 0) setMessageError([]);
        }
    };

    const handleSubmit = async (values: object) => {
        const dataFrom = values as positionSubmit;
        setLoadingQuery(0);
        dispatch(setLoading({ loadingAction: 0, showLoading: true }));

        try {
            if (!session?.user.company_id) {
                return showMessage({ status: "error", text: "พบข้อผิดพลาดกรุณาเข้าสู่ระบบใหม่อีกครั้ง" });
            }
            // updatePosition
            if (editData?.key) {
                const updatePosition = await updateDataPositionMutation.mutateAsync({
                    token: session?.user.accessToken,
                    positionData: {
                        id: parseInt(editData.key, 10),
                        name: dataFrom.name,
                        salary: parseFloat(dataFrom.salary),
                        companyId: session.user.role === "admin" ? dataFrom.company ? dataFrom.company : session?.user.company_id : session?.user.company_id,
                        status: dataFrom.status === "Active" ? "Active" : "InActive",
                    },
                    setLoadingQuery: setLoadingQuery
                });

                if (updatePosition === null) return showMessage({ status: "error", text: "แก้ไขข้อมูลสาขาไม่สำเร็จ กรุณาลองอีกครั้ง" });
                if (updatePosition?.status === true) {
                    setTimeout(() => { onClick(); }, 1500);
                    return showMessage({ status: "success", text: "แก้ไขข้อมูลสาขาสำเร็จ" });
                }
                if (typeof updatePosition.message !== 'string') setMessageError(updatePosition.message);
                return showMessage({ status: "error", text: "แก้ไขข้อมูลสาขาไม่สำเร็จ กรุณาแก้ไขข้อผิดพลาด" });
            }
            // Insert Branch
            if (!dataFrom.salary) {
                return showMessage({ status: "error", text: "ไม่พบข้อมูลเงินเดือนของตำแหน่งพนักงาน" });
            }
            const addPosition = await addDataPositionMutation.mutateAsync({
                token: session?.user.accessToken,
                positionData: {
                    name: dataFrom.name,
                    salary: parseFloat(dataFrom.salary),
                    companyId: session.user.role === "admin" ? dataFrom.company ? dataFrom.company : session?.user.company_id : session?.user.company_id,
                    status: dataFrom.status === "Active" ? "Active" : "InActive",
                },
                setLoadingQuery: setLoadingQuery
            });

            if (addPosition === null) return showMessage({ status: "error", text: "เพิ่มข้อมูลตำแหน่งพนักไม่สำเร็จ กรุณาลองอีกครั้ง" });
            if (addPosition?.status === true) {
                setTimeout(() => { onClick(); }, 1500);
                return showMessage({ status: "success", text: "เพิ่มข้อมูลตำแหน่งพนักงานสำเร็จ" });
            }
            if (typeof addPosition.message !== 'string') setMessageError(addPosition.message);
            return showMessage({ status: "error", text: "เพิ่มข้อมูลตำแหน่งพนักไม่สำเร็จ กรุณาแก้ไขข้อผิดพลาด" });
        } catch (error: unknown) {
            console.error('Failed to add data:', error);
        }
    };

    useEffect(() => {
        const loadComponents = () => {
            if (loadingQuery > 0) { dispatch(setLoading({ loadingAction: loadingQuery, showLoading: true })); }
        };

        loadComponents();
    }, [loadingQuery]);

    const handleRefresh = () => {
        remove();
        return refetch();
    }

    if (isLoading) {
        return <div className="mx-3"><Skeleton.Input active={true} size="small" /></div>;
    }

    if (isError) {
        return <ErrPage onClick={handleRefresh} />;
    }

    const MyForm = ({ onFinish }: { onFinish: (values: object) => void }): React.JSX.Element => {
        return (
            <Form layout="vertical" onFinish={(values) => { setFormValues(values as positionSubmit); onFinish(values); }} initialValues={formValues}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="name" label="ชื่อตำแหน่งพนักงาน"
                            rules={[
                                { required: true, message: "กรุณาระบุชื่อตำแหน่งพนักงาน" }
                                , {
                                    pattern: /^[^!@#\$%\^\&*\(\)_\+\{\}\[\]:;<>,\.\?~\\\/-]+$/,
                                    message: "ไม่สามารถระบุอักขระพิเศษได้",
                                },
                                { validator: validateWhitespace },
                            ]}
                        >
                            <Input placeholder="ระบุชื่อตำแหน่งพนักงาน" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="salary"
                            label="เงินเดือน"
                            rules={[
                                { required: true, message: "กรุณาระบุเงินเดือน" },
                                {
                                    pattern: /^\d+(\.\d{1,2})?$/,
                                    message: "กรุณาระบุตัวเลขและทศนิยมไม่เกิน 2 ตำแหน่ง",
                                },
                                { validator: validateWhitespace },
                            ]}
                        >
                            <Input type="number" step={0.01} placeholder="ระบุเงินเดือน" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    { session?.user.role === "admin" &&
                        <Col span={12}>
                            <Form.Item name="company" label="บริษัท"
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณาเลือกบริษัท",
                                    },
                                ]}
                            >
                                <Select showSearch placeholder="เลือกบริษัท" optionFilterProp="children" options={data ? data : []} allowClear
                                    filterOption={(input, option) => (option?.label ?? '').includes(input)}
                                    filterSort={(optionA, optionB) => (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())}
                                />
                            </Form.Item>
                        </Col>
                    }
                    <Col span={12}>
                        <Form.Item name="status" label="สถานะ"
                            rules={[
                                {
                                    required: true,
                                    message: "กรุณาเลือกสถานะ",
                                },
                            ]}
                        >
                            <Select
                                options={optionStatus}
                                placeholder="เลือกสถานะ"
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <ProgressBar />
                <SaveBtn label="บันทึกข้อมูล" />
            </Form>
        );
    };

    return (
        <div>
            {contextHolder}
            <DrawerActionData resetForm={resetForm} formContent={<MyForm onFinish={handleSubmit} />} title={title} showError={messageError} statusAction={statusAction} />
        </div>
    )
}

export default PositionFrom