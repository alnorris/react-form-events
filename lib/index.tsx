/* eslint-disable react-hooks/exhaustive-deps */
// @ts-nocheck
import { useState, useRef, useCallback,useMemo, useEffect } from 'react'

type SetErrorFunction<T> = (fieldName: keyof T, value: T[keyof T] | null | boolean) => void
type SetFormFunction<T> = (fieldName: keyof T, value: T[keyof T]) => void
type SetAllFieldsFn<T> = (formValues: T) => void
type SetAllErrorsFn<T> = (errors: Partial<T>) => void
type ShouldFormSubmitDefault<T> = (args: { formValues: T }) => void
type ResetForm = () => void
type ClearAllErrorsFn = () => void

interface DefaultProps {
  name: string
  value: any
  onChange: any
  onBlur: any
}


interface DefaultCheckedProps {
  name: string
  checked: any
  onChange: any
  onBlur: any
}

type InternalChangeValueFn<T> = (args: Partial<FormSelf<T>> & Field<T>) => void
type SetFormField<T> = (args: Field<T>) => void
type RegisterFieldDefaultFn<T> = (key: keyof T) => DefaultProps
type RegisterCheckBoxDefaultFn<T> = (key: keyof T) => DefaultCheckedProps
type RegisterRadioDefaultFn<T> = <K extends keyof T>(name: K, radioValue: T[K]) => DefaultCheckedProps





type FieldRegister<T> = {
  props: DefaultProps
} & Field<T>

type Field<T> = {
  fieldName: keyof T,
  value: T[keyof T]
}

type FormSelf<T> = {
  isDirty: boolean,
  isSemiDirty: boolean,
  setAllFields: SetAllFieldsFn<T>,
  submitting: boolean,
  clearAllErrors: ClearAllErrorsFn
  hasErrors: boolean,
  formErrors: FormErrors<T>
  setAllErrors: SetAllErrorsFn<T>,
  registerField: RegisterFieldDefaultFn<T>
  registerCheckBoxField: RegisterCheckBoxDefaultFn<T>
  registerRadioField: RegisterRadioDefaultFn<T>
  handleSubmit: any
  formValues: T,
  setFormField: SetFormField<T>
  resetForm: ResetForm
  setError?: SetErrorFunction<T>
}

type FormPrivateSelf<T, S> = FormSelf<T> & {
  fieldDidChange: UseFormArgs<T, S>["fieldDidChange"]
} & Partial<S>

type FormSelfField<T> = FormSelf<T> & Field<T>

type FormSelfFieldRegister<T> = FormSelf<T> & FieldRegister<T>

type FieldPrivateSelf<T, S> = FormPrivateSelf<T, S> & FormSelfField<T>

type FormErrors<T> = {
  [P in keyof T]?: string | null;
}

type FormCatch<T> =
  FormSelf<T> & {
    catchError: unknown
  }
type UseFormArgs<T, S = {}> = {
  defaultValues: T
  fieldOnRegister?: (arg: FormSelfFieldRegister<T>) => DefaultProps
  formOnMount?: (arg: FormPrivateSelf<T, S>) => | any

  fieldDidRegister?: (arg: FormSelfFieldRegister<T>) => Promise<any> | any
  formDidMount?: (arg: FormPrivateSelf<T, S>) => Promise<any> | any

  fieldOnChange?: (arg: FormSelfField<T>) => Promise<any> | any
  fieldDidChange?: (arg: FieldPrivateSelf<T, S>) => Promise<any> | any
  formOnSubmit?: (arg: FormSelf<T>) => Promise<any> | any
  shouldFormSubmit?: (arg: FormSelf<T>) => Promise<boolean> | boolean
  formDidSubmit?: (arg: FormSelf<T>) => Promise<any> | any

  submitDidCatch?: (arg: FormCatch<T>) => Promise<any> | any
  formDidFinally?: (arg: FormSelf<T>) => Promise<any> | any

  formWillUnmount?: (arg: FormSelf<T>) => Promise<any> | any

  fieldOnBlur?: (arg: FormSelfField<T>) => Promise<any> | any
} & S


const useForm = <T, S = {}>(args?: UseFormArgs<T, S>) => {
  const {
    defaultValues,
    formDidSubmit,
    submitDidCatch,
    fieldOnChange,
    fieldDidChange,
    formDidFinally,
    formOnSubmit,
    formWillUnmount,
    fieldDidRegister,
    fieldWillRegister,
    formDidMount,
    fieldOnBlur,
    formWillMount,
    shouldFormSubmit
  } = args ?? {}

  const formSelfRef = useRef<FormPrivateSelf<T, S>>();

  const [formValues, setFormState] = useState<T>(defaultValues)

  const defaultFormErrors = useMemo(() => {
    return Object.keys(defaultValues).reduce((acc, curr) => {
      return { ...acc, [curr]: null }
    }, defaultValues) as FormErrors<T>
  }, [defaultValues]);

  const [formErrors, setFormErrors] = useState<FormErrors<T>>(defaultFormErrors)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [fieldChanged, setFieldChanged] = useState<keyof T>(null)

  const hasErrors = useMemo(() => {
    return Object.keys(formErrors).some(field => formErrors[field] !== null)
  }, [formErrors]);

  const isDirty = useMemo(() => {
    return Object.keys(formValues).every(field => formValues[field] !== defaultValues[field])
  }, [formValues, defaultValues]);

  const isSemiDirty = useMemo(() => {
    return Object.keys(formValues).some(field => formValues[field] !== defaultValues[field])
  }, [formValues, defaultValues]);

  const setForm: SetFormFunction<T> = useCallback((fieldName, value) => {
    setFormState((formValues) => ({
      ...formValues,
      [fieldName]: value
    }))
  }, [setFormState])

  const setError: SetErrorFunction<T> = useCallback((fieldName, value) => {
    setFormErrors((formError) => ({
      ...formError,
      [fieldName]: value
    }))
  }, [setFormErrors])

  const setAllErrors: SetAllErrorsFn<T>  = useCallback((errors) => {
    if(!errors) return
    for (const fieldName in errors) {
      setError(fieldName, errors[fieldName])
    }
  }, [setError])

  const clearAllErrors: ClearAllErrorsFn = useCallback(() => {
    for (const fieldName in formErrors) {
      setError(fieldName, null)
    }
  }, [setError, formErrors])

  const shouldFormSubmitDefault: ShouldFormSubmitDefault<T> = useCallback(() => {
    return !hasErrors
  }, [hasErrors])




  const resetForm: ResetForm = () => {
    setFormErrors(defaultFormErrors)
    setFormState(defaultValues)
    setSubmitting(false)
  }


  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setSubmitting(true)

    if(formOnSubmit) {
      formOnSubmit({ ...formSelf, submitting: true })
    } else {
      clearAllErrors()
    }
  }

  const registerFieldDefault = <K extends keyof T>({ fieldName }): DefaultProps => {
    return {
      onBlur: (val: any) => {
        const value: T[K] = val?.target?.value ?? val
        fieldOnBlur?.({ ...formSelf, fieldName, value })
      },
      name: fieldName,
      value: formValues?.[fieldName],
      onChange: (val: any) => {
        const value: T[K] = val?.target?.value ?? val
        _changeValue({ fieldName, value })
      }
    }
  }

  const registerCheckBoxDefault = <K extends keyof T>({ fieldName }): DefaultProps => {
    return {
      onBlur: (val: any) => {
        const value: T[K] = val?.target?.value ?? val
        fieldOnBlur?.({ ...formSelf, fieldName, value })
      },
      name: fieldName,
      checked: formValues?.[fieldName],
      onChange: (val: any) => {
        const value: T[K] = val?.target?.checked ?? val
        _changeValue({ fieldName, value })
      }
    }
  }

  const registerRadioDefault = <K extends keyof T>({ fieldName, radioValue }): DefaultProps => {
    return {
      onBlur: (val: any) => {
        const value: T[K] = val?.target?.value ?? val
        fieldOnBlur?.({ ...formSelf, fieldName, value })
      },
      name: fieldName,
      checked: radioValue === formValues?.[fieldName],
      onChange: (val: any) => {
        // const value: T[K] = val?.target?.checked ?? val
        _changeValue({ fieldName, value: radioValue })
      }
    }
  }


  const registerField = <K extends keyof T>(name: K) => {
    const defaultProps = registerFieldDefault({ fieldName: name })

    // if(fieldWillRegister) {
    //   return fieldWillRegister({
    //     fieldName: name,
    //     value: defaultValues[name],
    //     props: defaultProps,
    //     ...formSelf
    //   })
    // }
    return defaultProps
  }


  const registerCheckBoxField = <K extends keyof T>(name: K) => {
    const defaultProps = registerCheckBoxDefault({ fieldName: name })

    // if(fieldWillRegister) {
    //   return fieldWillRegister({
    //     fieldName: name,
    //     value: defaultValues[name],
    //     props: defaultProps,
    //     ...formSelf
    //   })
    // }
    return defaultProps
  }


  const registerRadioField = <K extends keyof T>(name: K, radioValue: T[K]) => {
    const defaultProps = registerRadioDefault({ fieldName: name, radioValue })

    // if(fieldWillRegister) {
    //   return fieldWillRegister({
    //     fieldName: name,
    //     value: defaultValues[name],
    //     props: defaultProps,
    //     ...formSelf
    //   })
    // }
    return defaultProps
  }



  const setFormField: SetFormField<T> = useCallback((args) => {
    _changeValue({ fieldName: args.fieldName, value: args.value })
  }, [])

  const onFieldChangingDefault: UseFormArgs<T, S>["fieldDidChange"] = ({ fieldName, value }) => {
    setForm(fieldName, value)
    setError(fieldName, null)
    setFieldChanged(fieldName)
  }

  const setAllFields: SetAllFieldsFn<T> = useCallback((args = formValues) => {
    for (const fieldName in args) {
      _changeValue({ fieldName, value: args[fieldName] })
    }
  }, [])



  const formSelf: FormSelf<T> = {
    setAllFields,
    hasErrors,
    isDirty,
    clearAllErrors,
    submitting,
    isSemiDirty,
    registerField,
    handleSubmit,
    setFormField,
    formErrors,
    setAllErrors,
    resetForm,
    formValues,
    setError,
  }

  const formPrivateSelf: FormPrivateSelf<T, {}> = {
    ...formSelf,
    fieldDidChange,
  }

  formWillMount?.(formPrivateSelf)


  useEffect(() => {
    if(fieldChanged) {
      fieldDidChange?.({ fieldName: fieldChanged, value: formValues[fieldChanged], ...formSelfRef.current })
      setFieldChanged(null)
    }
  }, [fieldChanged, formValues[fieldChanged]])

  const _changeValue: InternalChangeValueFn<T> = (args) => {
    if(fieldOnChange) {
      fieldOnChange({ ...formSelf, fieldName: args.fieldName, value: args.value  })
    } else {
      onFieldChangingDefault({ ...formSelfRef.current, fieldName: args.fieldName, value: args.value })
    }
  }




  useEffect(() => {
    formSelfRef.current = formPrivateSelf

    if(fieldDidRegister) {
      for (const fieldName in formValues) {
        const defaultProps = registerField(fieldName)
        fieldDidRegister?.({ fieldName, props: defaultProps, value: formValues[fieldName], ...formSelf })
      }
    }

    formDidMount?.(formSelfRef.current)

    return () => {
      formWillUnmount?.(formSelf)
    }
  }, [])


  const _onSubmit = async () => {
    const isFormSubmittable = (
      shouldFormSubmit ? (await shouldFormSubmit(formSelf)) : shouldFormSubmitDefault(formSelf)
    )

    if(!isFormSubmittable) {
      setSubmitting(false)
      return
    }

    try {
      await formDidSubmit(formSelf)
    }
    catch (catchError: unknown) {
      if(submitDidCatch) {
        submitDidCatch?.({ ...formSelf, catchError })
      } else {
        console.error(catchError)
      }
    }
    finally {
      setSubmitting(false)
      formDidFinally?.(formSelf)
    }
  }

  useEffect(() => {
    if(submitting) {
      _onSubmit()
    }
  }, [submitting, formErrors])

  return {
    registerField,
    registerCheckBoxField,
    registerRadioField,
    handleSubmit,
    ...formSelf
  }
}


const yupToFormErrors = (yupError: any) => {
  let errors = {};
  if (yupError.inner) {
    if (yupError.inner.length === 0) {
      const { path, message } = yupError
      return { [path]: message }
    }
    for (let err of yupError.inner) {
      const { path, message } = err
      errors = {
        [path]: message,
        ...errors,
      }
    }
  }
  return errors;
}


export const validateYupError = (schema, formValues) => {
  try {
    schema.validateSync(formValues, {
      abortEarly: false,
    })
    return {}
  } catch(err) {
    return yupToFormErrors(err)
  }
}


export default useForm