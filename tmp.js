let tree = [
  {
    id: 1,
    isChecked: false,
    children: [
      {
        id: 2,
        isChecked: true,
        children: [
          {
            id: 5,
            isChecked: true,
          },
          {
            id: 6,
            isChecked: true,
          }
        ]
      },
      {
        id: 3,
        isChecked: false,
        children: [
          {
            id: 4,
            isChecked: true
          }
        ]
      }
    ]
  }
]

const getCheckedIds = (data) => {
  let checkedIds = []
  console.log('isChecked: ', data.isChecked)
  if(data.isChecked) 
    checkedIds.push(data.id)
  if(data.children) {
    data.children.forEach(child => {
      checkedIds = checkedIds.concat(getCheckedIds(child))
    })
  }
  return checkedIds
}

const getIds = (data) => {
  let result = []
  data.forEach(child => {
    result = getCheckedIds(child)
  })
  return result
} 

console.log(getIds(tree))
