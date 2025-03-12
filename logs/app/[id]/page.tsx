import { db } from "@/lib/db";

interface Props {
    params: {
        id: number;
    };
}

export default async function Page({ params }: Props) {
    const text = await db.copy.findFirst({
        where: {
            id:  Math.trunc(params.id),
        },
    });

    return (
        <div>
            {text?.text}
        </div>
    );
}
