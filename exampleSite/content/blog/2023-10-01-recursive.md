---
title: recursive operations
date: 2023-10-01
---

In most cases, we can traverse data by loop according to its index; and most languages provide syntatic-sugar for the iteration of such data, such as list comprehension in python and `let i in array` grammar in javascript. However, the recursion is needed if you want to traverse unstructured data, such as list in R, dictionary in javascript, and object in javascript.

The recursion on such complex data comonly includes a `if else` structure; the first case is your desired behavior on objects's specified children node; the second  is the recursive case that is loop over the data and recursion on each element. a example from [modern javascript](https://javascript.info/recursion#recursive-traversals)

```javascript
let company = { // the same object, compressed for brevity
  sales: [{name: 'John', salary: 1000}, {name: 'Alice', salary: 1600 }],
  development: {
    sites: [{name: 'Peter', salary: 2000}, {name: 'Alex', salary: 1800 }],
    internals: [{name: 'Jack', salary: 1300}]
  }
};

// The function to do the job
function sumSalaries(department) {
  if (Array.isArray(department)) { // case (1)
    return department.reduce((prev, current) => prev + current.salary, 0); // sum the array
  } else { // case (2)
    let sum = 0;
    for (let subdep of Object.values(department)) {
      sum += sumSalaries(subdep); // recursively call for subdepartments, sum the results
    }
    return sum;
  }
}
```

The disadvantage of recursion is that stack overflow may occur; You should carefully consider all if cases otherwise stack overflow happens. Recursive traversals on R's list.

```r
foo2 <- function(l) {
  if ((is.list(l) && !any(sapply(l, is.list))) || is.atomic(l)) {
    print(l) # desired manipulation on target children nodes
  } else { # recursive case
    for (i in seq_along(l)) {
      foo2(l[[i]])
    }
  }
}
```

A solution in [stackoverflow.org](https://stackoverflow.com/questions/29818918/looping-nested-lists-in-r)

```r
foo <- function(l){
    lapply(l, function(x) if(is.list(x) && length(x)==0) "" else if(is.list(x)) foo(x) else x)
}
```

Recursion on environments  from [advanced R](https://adv-r.hadley.nz/environments.html#env-recursion)

```r
where <- function(name, env = caller_env()) {
  if (identical(env, empty_env())) {
    # Base case
    stop("Can't find ", name, call. = FALSE)
  } else if (env_has(env, name)) {
    # Success case
    env
  } else {
    # Recursive case
    where(name, env_parent(env))
  }
}
```

A loop solution on environments traverals

```r
f2 <- function(..., env = caller_env()) {
  while (!identical(env, empty_env())) {
    if (success) {
      # success case
      return()
    }
    # inspect parent
    env <- env_parent(env)
  }

  # base case
}
```
