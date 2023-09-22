

import {  PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, TableDropdown } from '@ant-design/pro-components';
import { Button, Space, Tag ,Select,Col,Tooltip,Popover,Checkbox,Tree} from 'antd';
import { useEffect, useRef ,useState,useMemo } from 'react';
import {  Table ,Form,Input} from 'antd';
import { useCompositeState } from './utils/customHooks.js';
import debounce from 'lodash/debounce';
import elementResizeDetectorMaker from 'element-resize-detector';
import produce from 'immer';


import { DownOutlined ,RedoOutlined ,SettingOutlined } from '@ant-design/icons';

import './index.css'

const FIXED_COLUMN_WIDTH = 200;
const DEFAULT_COLUMN_WIDTH = 200;

const erd = elementResizeDetectorMaker();
type ColumnsControlProps = {
    columns: Array<{
      // 其余属性和antd table Columns保持一致
      checked: {
        // 控制列的默认行为
        disabled: boolean, // 设置为true禁止勾选
        defaultChecked: boolean, // 是否默认展示
      },
    }>, // 源columns
    onChange: Function,
    configurable: boolean, // 是否支持动态设置展示内容
    useRowSelection: boolean, // 是否支持选择，支持则计算宽度需要减去rowSelection的60px
  };

 const ellipsisColumns = (columns = []) => {
    if (columns instanceof Array && columns.length) {
      return columns.map(item => {
        const { title, children } = item;
        if (typeof title === 'string') {
          return children
            ? {
                ...item,
                title: <span title={title}>{title}</span>,
                children: ellipsisColumns(children),
              }
            : { ...item, title: <span title={title}>{title}</span> };
        } else {
          return children ? { ...item, children: ellipsisColumns(children) } : { ...item };
        }
      });
    }
    return columns;
  };

// 动态控制表单列
const ColumnsControl = ({
    columns,
    onChange,
    configurable = true,
    useRowSelection,
  }: ColumnsControlProps) => {
    const allColumns = useRef([]);
    const defaultCheckedValues = useRef([]);
    const fixedValues = useRef([]);
  
    const [
      { checkedColumns, columnsTranscript, tableWidth, allChecked, indeterminate },
      setState,
    ] = useCompositeState({
      indeterminate: false,
      allChecked: true,
      checkedColumns: [],
      columnsTranscript: [],
      tableWidth: 0,
    });
  
    // 防抖500ms避免触发太频繁
    const setTableWithDebounced = debounce(tableWidth => {
      setState({ tableWidth });
    }, 500);
  
    useEffect(() => {
      setState({
        columnsTranscript: columns,
        checkedColumns: defaultCheckedValues.current,
        indeterminate: isIndeterminate(defaultCheckedValues.current),
      });
  
      const [flexBox] = document.getElementsByClassName('enhanced-table');
      erd.removeAllListeners(flexBox); // 触发时先移除旧的监听器
      erd.listenTo(flexBox, ({ offsetWidth }) => {
        setTableWithDebounced(offsetWidth);
      });
      return () => {
        erd.removeAllListeners(flexBox);
        setTableWithDebounced.cancel();
      };
    }, []);
  
    useEffect(() => {
      // 动态计算columns宽度
      // 默认最小宽度设置为200px
      let fixedColumns = 0;
      let unfixedColumns = 0;
      onChange?.(
        produce(columnsTranscript, draft => {
          // 处理children
          let loopCount = draft.length;
          for (let i = 0; i < loopCount; i++) {
            const item = draft[i];
            if (item.children) {
              // eslint-disable-next-line no-loop-func
              item.children = item.children.filter(({ dataIndex }) => {
                const checked = checkedColumns.includes(dataIndex);
                if (checked) {
                  unfixedColumns++;
                }
                return checked;
              });
              if (!item.children.length) {
                draft.splice(i, 1);
                loopCount--;
                i--;
              }
            } else {
              if (checkedColumns.includes(item.dataIndex || item.key)) {
                if (item.fixed) {
                  item.width = FIXED_COLUMN_WIDTH;
                  fixedColumns++;
                } else {
                  unfixedColumns++;
                }
              } else {
                draft.splice(i, 1);
                loopCount--;
                i--;
              }
            }
          }
          const calcWidth = Math.round(
            (tableWidth - 60 * (useRowSelection ? 1 : 0) - fixedColumns * FIXED_COLUMN_WIDTH) /
              unfixedColumns
          );
          // 减去1pxborder
          const unfixedColumnsWidth =
            calcWidth > DEFAULT_COLUMN_WIDTH ? calcWidth - 1 : DEFAULT_COLUMN_WIDTH;
          draft.forEach(item => {
            if (!item.fixed) {
              if (item.children) {
                item.children.forEach(child => {
                  child.width = unfixedColumnsWidth;
                });
              } else {
                item.width = unfixedColumnsWidth;
              }
            }
          });
        })
      );
    }, [columnsTranscript, checkedColumns, tableWidth]);
  
    const convertTreeData = (dataSource:any)=>
      dataSource.map(
        ({
          title,
          dataIndex,
          key,
          children,
          checked: { defaultChecked = true, disabled = false } = {},
        }) => {
          allColumns.current.push(dataIndex || key);
          if (defaultChecked) {
            defaultCheckedValues.current.push(dataIndex || key);
          }
          if (disabled) {
            fixedValues.current.push(dataIndex || key);
          }
          if (children) {
            return {
              title,
              key: dataIndex || key, // key和dataIndex至少有一个
              children: convertTreeData(children),
              disabled, // fixed属性禁止勾选
            };
          } else {
            return {
              title,
              key: dataIndex || key,
              disabled,
            };
          }
        }
      );
  
    const treeData = useMemo(() => convertTreeData(columns), [columns]);
  
    const handleTreeCheck = (checkedList: Array<string>) => {
      setState({
        allChecked: !!checkedList.length && checkedList.length === allColumns.current.length,
        checkedColumns: checkedList,
        indeterminate: isIndeterminate(checkedList),
      });
    };
  
    // 全选或全不选
    const handleCheckAllChange = ({ target: { checked } }) => {
      setState({
        allChecked: checked,
        checkedColumns: checked ? allColumns.current : fixedValues.current,
        indeterminate: false,
      });
    };
  
    // 重置默认选中列
    const resetColumns = () => {
      setState({
        allChecked: defaultCheckedValues.current.length === allColumns.current.length,
        checkedColumns: defaultCheckedValues.current,
        indeterminate: isIndeterminate(defaultCheckedValues.current),
      });
    };
  
    const isIndeterminate = (checkedList:any) =>
      !!checkedList.length && checkedList.length < allColumns.current.length;
  
    return (
      <div className="columns-control">
        {configurable ? (
          <Popover
            overlayClassName="columns-checkbox-popover"
            title={[
              <Checkbox
                onChange={handleCheckAllChange}
                indeterminate={indeterminate}
                checked={allChecked}
                key="checkbox"
              >
                 列展示
              </Checkbox>,
              <a key="a" onClick={resetColumns} style={{ float: 'right' }}>
               重置
              </a>,
            ]}
            content={
              <Tree
                checkable
                checkedKeys={checkedColumns}
                selectable={false}
                treeData={treeData}
                onCheck={handleTreeCheck}
              />
            }
            trigger="click"
            placement="bottomRight"
            arrowPointAtCenter
          >
            <Tooltip title='设置'>
              <SettingOutlined />
            </Tooltip>
          </Popover>
        ) : (
          false
        )}
      </div>
    );
  };

const Protable = (props:any) => {
    const { columns, request ,pagination,rowSelection,...rest} = props;
    const [dataSource, setDataSource] = useState([]);
    const [tableColumns,setTableColumns] = useState([]);
    const [loading,setLoading] = useState(false)
    const [searchLoading,setSearchLoading]= useState(false)
    const [form] = Form.useForm();
    const [expand, setExpand] = useState(false);
    const [searchFieldList,setSearchFieldList] = useState([] as any)
    const [total,setTotal] = useState(0)
    const [currentColumns, setCurrentColumns] = useState(ellipsisColumns(columns));
    const [paginationParams,setPaginationParams] = useState({current:1,pageSize:20} as any) 

    useEffect(()=>{
       if(pagination){
        if(pagination.pageSize){
            setPaginationParams({...paginationParams,pageSize:pagination.pageSize})
        }
        if(pagination.current){
            setPaginationParams({...paginationParams,current:pagination.current})
        }
       }
    },[pagination])
   
    const triggerRequest = async ()=>{
        // 获取表单里选择的值
       const values = form.getFieldsValue()

       console.log('values-----22-',values)
        const params = {
            current:paginationParams.current,
            pageSize:paginationParams.pageSize,
            ...values
        }
        setLoading(true)
       return request(params).then((res:any)=>{
            console.log('res--333----',res)
            const {data,success,total} = res;
            setDataSource(data)
            setTotal(total)
        }).finally(()=>{
            setLoading(false)
        })
    }
    useEffect(()=>{
        triggerRequest()
    },[paginationParams])

    const onRefresh = ()=>{
        triggerRequest()
    }
    const onFinish = (values:any)=>{
        console.log('values-------',values)
        setSearchLoading(true)
        triggerRequest().then(()=>{
            setSearchLoading(false)
        })
    }
    const getFields = () => {
        if(!searchFieldList.length){
            return null
        }
        const count = expand ? searchFieldList.length : 3;
        const children = [];
        for (let i = 0; i < count; i++) {
          const item = searchFieldList[i];
          let FormItemContent;
          if(item.renderFormItem){
             FormItemContent = item.renderFormItem(null, { type:'table', defaultRender:null}, null)
         }else{
            if(item.valueType === 'select'){
                const {valueEnum} = item;
                FormItemContent = (<Select placeholder="请选择">
                    { Object.keys(valueEnum).map((value)=>{
                      return (<Select.Option value={value} disabled={valueEnum[value].disabled}>{valueEnum[value].text}</Select.Option>)
                     })
                    }
                   </Select>)
            }else{
                // 默认是text类型
                FormItemContent =  <Input  placeholder='请输入'/>
            }
         }
          children.push(
            <Col span={6} key={i}>
            <Form.Item label={item.title}  name={item.dataIndex} className='search-form-item'>
                {FormItemContent}
            </Form.Item>
            </Col>,
          );
        }
        return children;
      };
    useEffect(()=>{
        const filteredColumns = columns.filter((it:any)=>!it.hideInTable)
        const searchFields = columns.filter((it:any)=>{ return it.valueType !== 'index' && it.valueType!=='option' && !it.hideInSearch})
        setTableColumns(filteredColumns)
        setCurrentColumns(filteredColumns)
        setSearchFieldList(searchFields)
    },[columns])
    
    return (<div>
         <Form
      layout={'inline'}
      form={form}
      className='protable-search-form'
      onFinish={onFinish}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
    >
       {
        getFields()
       }
        {<div style={{ textAlign: 'right',flex:1,paddingTop:'10px'}}>
        <Space size="small">
        <Button
            onClick={() => {
              form.resetFields();
              triggerRequest();
            }}
          >
            重置
          </Button>
          <Button type="primary" htmlType="submit" loading={searchLoading}>
            查询
          </Button>
          {searchFieldList.length > 3 && (
             <a
              style={{ fontSize: 12 }}
              onClick={() => {
                  setExpand(!expand);
               }}
               >
                  {expand?'收起':'展开'} <DownOutlined rotate={expand ? 180 : 0} />
               </a>
          )}
         
        </Space>
      </div>}
    </Form>
    <div className='toolbar'>  
            <Tooltip title='刷新'>
            <RedoOutlined onClick={onRefresh} className='mr20'/> 
            </Tooltip>
            <ColumnsControl
              useRowSelection={!!rowSelection}
              columns={tableColumns}
              onChange={(columns:any)=> {
                setCurrentColumns(columns);
              }}
            /> </div>
 
        <Table
           className="enhanced-table"
           onChange={(paginationinfo)=>{
            setPaginationParams({
                pageSize:paginationinfo.pageSize,
                current:paginationinfo.current
            })
            pagination && pagination.onChange && pagination.onChange(paginationinfo)
           }}
         columns={currentColumns} 
         dataSource={dataSource} 
         loading={loading} 
        pagination={{
            total,
            pageSize:(pagination && pagination.pageSize)?pagination.pageSize:paginationParams.pageSize, 
            current:(pagination&& pagination.current)?pagination.current:paginationParams.current, 
            showTotal: (num,range) => {
            return`第 ${range[0]}-${range[1]} 条/总共 ${num} 条`}
            }}
             {...rest}/>
        </div>)
}


export default Protable;