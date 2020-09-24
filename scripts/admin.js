const AV = require('leancloud-storage');

AV.init({
  appId: 'i5cCPnXe2wQAUPMj7cy0eLEO-gzGzoHsz',
  appKey: 'pgjAADXhxTtgrUj5GbYqNokD',
});

const getAVImgFromAVFile = file => {
  return {
    id: file.id,
    url: file.url(),
    thumbUrl: file.thumbnailURL(100, 100),
    name: file.name(),
  };
};

async function main() {
  const user = new AV.User();
  user.setUsername('admin');
  user.setPassword('mcakeadmin');
  await user.logIn();

  try {
    // const roleQuery = new AV.Query(AV.Role);
    // const roles = await roleQuery.find();
    // const adminRole = roles[0];
    // const query = new AV.Query('Setting');
    // const ret = await query.find();
    // const acl = new AV.ACL();
    // acl.setPublicReadAccess(true);
    // acl.setRoleWriteAccess(adminRole, true);
    // for (let i of ret) {
    //   i.setACL(acl);
    // }
    // await AV.Object.saveAll(ret);
    console.log('success');
  } catch (err) {
    console.log(err);
  }
}

main();
