import * as AV from 'leancloud-storage';
import * as React from 'react';
import { Form, Button, Upload, Icon } from 'antd';
import moment from 'moment';
export async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getTree(
  data: AV.Queriable[],
  parentKeyName = 'pNode',
  childrenKeyName = 'children'
) {
  const rData = [];
  for (let i of data) {
    const p = i.get('pNode');
    if (p) {
      const pObject = data.find(ri => ri.id === p.id);
      if (!pObject) continue;
      if (!pObject['children']) pObject['children'] = [];
      pObject['children'] = [...pObject.children, i];
    } else {
      rData.push(i);
    }
  }
  return rData;
}

export const getAVImgFromAVFile = (file: AV.File) => {
  return {
    id: file.id,
    url: file.url(),
    thumbUrl: file.thumbnailURL(100, 100),
    name: file.name(),
  };
};

export const getUploadListItem = (img: AVImg, index: number) => ({
  ...img,
  uid: index,
  status: 'done',
});

export const uploadFiles = async (files: any) => {
  const retFiles = [];
  for (let file of files) {
    if (file.id) {
      retFiles.push(file);
    } else {
      const avFile = new AV.File(file.name, file.originFileObj);
      const retFile = await avFile.save();
      retFiles.push(getAVImgFromAVFile(retFile));
    }
  }
  return retFiles;
};

export const renderUploadItem = ({
  name,
  label,
  maxFileNum = 1,
  getFieldDecorator,
  getFieldValue,
  initialValue,
  rules = [],
  formLayoutProps = { labelCol: { span: 4 }, wrapperCol: { span: 20 } },
}) => {
  return (
    <Form.Item label={label} {...formLayoutProps}>
      {getFieldDecorator(name, {
        valuePropName: 'fileList',
        getValueFromEvent: (e: any) => {
          if (Array.isArray(e)) {
            return e;
          }
          return e && e.fileList;
        },
        rules,
        initialValue,
      })(
        <Upload
          multiple={maxFileNum > 1}
          listType="picture"
          accept="image/*"
          className="upload-list-inline">
          {(!getFieldValue(name) || getFieldValue(name).length < maxFileNum) && (
            <Button>
              <Icon type="upload" /> 上传{label}
            </Button>
          )}
        </Upload>
      )}
    </Form.Item>
  );
};

/**
 *
 * @param no "no" is actually "pwd" here, because feature has changed
 */


function closest(el, selector) {
  const matchesSelector =
    el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;
  while (el) {
    if (matchesSelector.call(el, selector)) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}


export function generateMobile() {
  const prefixArray = ['130', '131', '132', '133', '135', '137', '138', '170', '187', '189'];
  const i = Math.floor(10 * Math.random());
  let prefix = prefixArray[i];
  for (var j = 0; j < 8; j++) {
    if (j < 4) {
      prefix = prefix + '*';
    } else {
      prefix = prefix + Math.floor(Math.random() * 10);
    }
  }
  return prefix;
}

export function getRandomDateBetween() {
  function RandomNumBoth(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.round(Rand * Range); //四舍五入
    return num;
  }
  var date = new Date();
  var e = date.getTime();
  var f = date.getTime() - 30 * 24 * 60 * 60 * 1000;
  return moment(new Date(RandomNumBoth(f, e))).format('YYYY-MM-DD hh:mm:ss');
}

export function paddingZero(num, length = 4) {
  let strNum = String(num);
  if (strNum.length < length) {
    for (let i = 0; i < (length - String(num).length); i++) {
      strNum = '0' + strNum
    }
  }
  return strNum;
}

/*
** randomWord 产生任意长度随机字母数字组合
** randomFlag-是否任意长度 min-任意长度最小位[固定位数] max-任意长度最大位
** xuanfeng 2014-08-28
*/

export function randomWord(length) {
  let str = "",
    range = length,
    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  for (let i = 0; i < range; i++) {
    const pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str.toUpperCase();
}


export function validateMobile(mobile) {
  return /^1[34578]\d{9}$/.test(mobile);
};

export function isWechat(){
    return navigator.userAgent.toLowerCase().indexOf('micromessenger') !== -1;
}
