import { EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, TableDropdown } from '@ant-design/pro-components';
import { Button, Dropdown, Space, Tag ,Select} from 'antd';
import { useRef } from 'react';
import request from 'umi-request';
import MyProtable from '../Protable';
import React, { useEffect, useState } from 'react';

export const waitTimePromise = async (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

export const waitTime = async (time: number = 100) => {
  await waitTimePromise(time);
};

type GithubIssueItem = {
  url: string;
  id: number;
  number: number;
  title: string;
  labels: {
    name: string;
    color: string;
  }[];
  state: string;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
};
const MySelect: React.FC<{
  /** Value 和 onChange 会被自动注入 */
  value?: string;
  onChange?: (value: string) => void;
}> = (props) => {

  const [innerOptions, setOptions] = useState<
    {
      label: React.ReactNode;
      value: number;
    }[]
  >([]);

  useEffect(() => {
      setOptions([
        {
          label: '星期一',
          value: 1,
        },
        {
          label: '星期二',
          value: 2,
        },
      ]);
  }, []);

  return (
    <Select
      options={innerOptions}
      value={props.value}
      onChange={props.onChange}
    />
  );
};

const columns: ProColumns<GithubIssueItem>[] = [
  {
    title: '标题',
    dataIndex: 'title',
  },
  {
    disable: true,
    title: '状态',
    dataIndex: 'state',
    valueType: 'select',
    valueEnum: {
      open: {
        text: '未解决',
      },
      closed: {
        text: '已解决',
        disabled: true,
      },
      processing: {
        text: '解决中',
      },
    },
  },
  {
    title: '创建时间',
    key: 'showTime',
    dataIndex: 'created_at',
    hideInSearch: true,
  },
  {
    title: '时间',
    key: 'period',
    hideInTable: true,
    dataIndex: 'period',
    renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
      return (
        <MySelect
          {...rest}
        />
      );
    },
  },
  {
    title: '操作',
    valueType: 'option',
    key: 'option',
    render: (text, record, _, action) => [
      <a href={record.url} target="_blank" rel="noopener noreferrer" key="view">
        查看
      </a>,
    ],
  },
];
const TestProtable = () => {
  return (
    <>
     <ProTable<GithubIssueItem>
      columns={columns}
      request={async (params = {}) => {
        console.log('查看request----protable',params);
        await waitTime(2000);
        return request<{
          data: GithubIssueItem[];
        }>('https://proapi.azurewebsites.net/github/issues', {
          params,
        });
      }}
      rowKey="id"
      pagination={{
        pageSize: 5,
        current:2,
        onChange: (page) => console.log('原本的',page),
      }}
    />
    <MyProtable   
    columns={columns}    
    request={async (params = {}) => {
      console.log('查看request-0---myprotable',params);
      await waitTime(2000);
      return request<{
        data: GithubIssueItem[];
      }>('https://proapi.azurewebsites.net/github/issues', {
        params,
      });
    }}
    rowKey="id"
    pagination={{
      pageSize: 5,
      onChange: (page:number) => console.log(page),
    }}
      />
    </>
   
  );
};
export default TestProtable;