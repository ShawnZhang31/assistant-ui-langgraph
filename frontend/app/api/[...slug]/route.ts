import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

async function handleRequest(req: NextRequest, method: string, pathSegments: string[]) {
  try {
    // const path = req.nextUrl.pathname.replace(/^\/?api\//, "");
    // const url = new URL(req.url);
    // const searchParams = new URLSearchParams(url.search);
    // // searchParams.delete("_path");
    // // searchParams.delete("nxtP_path");
    // const queryString = searchParams.toString()
    //   ? `?${searchParams.toString()}`
    //   : "";

    // 重建上游url
    // const path = pathSegments.join("/");
    const path = req.nextUrl.pathname.replace(/^\/?api\//, "");
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    while (searchParams.has("slug")) {
      searchParams.delete("slug");
    }
    const queryString = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";

    // console.log(`pathSegments: ${pathSegments}`);
    // console.log(`req.url: ${req.url}`);
    // console.log(`path: ${path}`);
    // console.log(`searchParams: ${searchParams.toString()}`);
    // console.log(`queryString: ${queryString}`);
    // console.log(`target url: ${process.env["LANGGRAPH_API_URL"]}/${path}${queryString}`);

    const options: RequestInit = {
      method,
      headers: {
        ...Object.fromEntries(req.headers.entries()),
        "Content-Type": "application/json",
        "x-api-key": process.env["LANGCHAIN_API_KEY"] || "sk-",
      },
    };

    console.log(`options: ${JSON.stringify(options)}`);

    if (["POST", "PUT", "PATCH"].includes(method)) {
      options.body = await req.text();
    }

    const res = await fetch(
      `${process.env["LANGGRAPH_API_URL"]}/${path}${queryString}`,
      options,
    );

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: {
        ...res.headers,
        ...getCorsHeaders(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

// 为各种方法都做一层包装
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(req, 'GET', params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(req, 'POST', params.path);
}
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(req, 'PUT', params.path);
}
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(req, 'PATCH', params.path);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(req, 'DELETE', params.path);
}

// Add a new OPTIONS handler
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(),
    },
  });
};