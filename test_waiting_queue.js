// ============================================
// 测试脚本：在浏览器控制台运行此代码
// ============================================
// 复制下面的代码，粘贴到浏览器控制台（F12 -> Console），然后按 Enter

(async function testWaitingQueue() {
  console.log('🧪 ========== 开始测试 Waiting Queue ==========');
  
  // 1. 检查 Supabase 连接
  console.log('1️⃣ 检查 Supabase 连接...');
  if (typeof supabase === 'undefined') {
    console.error('❌ supabase 未定义！');
    return;
  }
  console.log('✅ Supabase 连接正常');
  
  // 2. 检查当前用户
  console.log('\n2️⃣ 检查当前用户...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ 无法获取用户:', userError);
    return;
  }
  console.log('✅ 用户 ID:', user.id);
  
  // 3. 检查用户角色
  console.log('\n3️⃣ 检查用户角色...');
  const { data: userProfile, error: roleError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (roleError) {
    console.error('❌ 无法获取用户角色:', roleError);
  } else {
    console.log('✅ 用户角色:', userProfile?.role || 'null');
  }
  
  // 4. 直接查询 waiting 队列（模拟 Admin 查询）
  console.log('\n4️⃣ 查询 waiting 队列...');
  const { data: queues, error: queueError } = await supabase
    .from('consultation_queue')
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: true });
  
  if (queueError) {
    console.error('❌ 查询失败:', queueError);
    console.error('错误详情:', {
      message: queueError.message,
      code: queueError.code,
      details: queueError.details,
      hint: queueError.hint
    });
  } else {
    console.log('✅ 查询成功！');
    console.log('📊 返回的数据类型:', typeof queues);
    console.log('📊 是否为数组:', Array.isArray(queues));
    console.log('📊 队列数量:', queues?.length || 0);
    
    if (queues && queues.length > 0) {
      console.log('\n📋 队列详情:');
      queues.forEach((queue, index) => {
        console.log(`\n队列 ${index + 1}:`, {
          id: queue.id,
          patient_id: queue.patient_id,
          status: queue.status,
          created_at: queue.created_at,
          position: queue.position,
          estimated_wait_minutes: queue.estimated_wait_minutes,
          pharmacist_id: queue.pharmacist_id,
          // 检查所有字段
          allKeys: Object.keys(queue)
        });
      });
    } else {
      console.log('⚠️ 没有找到 waiting 队列');
    }
  }
  
  // 5. 检查 RLS 策略
  console.log('\n5️⃣ 检查 RLS 策略...');
  console.log('当前用户 ID:', user.id);
  console.log('用户角色:', userProfile?.role);
  
  // 6. 测试数据提取逻辑（模拟前端代码）
  console.log('\n6️⃣ 测试数据提取逻辑...');
  if (queues && queues.length > 0) {
    const testQueue = queues[0];
    console.log('测试队列对象:', testQueue);
    console.log('提取 id:', testQueue.id);
    console.log('提取 patient_id:', testQueue.patient_id);
    console.log('提取 status:', testQueue.status);
    console.log('提取 created_at:', testQueue.created_at);
    
    // 模拟前端显示逻辑
    console.log('\n7️⃣ 模拟前端显示逻辑...');
    const displayData = {
      id: testQueue.id,
      patientId: testQueue.patient_id,
      status: testQueue.status,
      createdAt: new Date(testQueue.created_at).toLocaleString(),
      position: testQueue.position || 'N/A',
      estimatedWait: testQueue.estimated_wait_minutes || 'N/A'
    };
    console.log('显示数据:', displayData);
  }
  
  console.log('\n✅ ========== 测试完成 ==========');
  return {
    user: user.id,
    role: userProfile?.role,
    queues: queues,
    queueCount: queues?.length || 0,
    hasError: !!queueError
  };
})();

