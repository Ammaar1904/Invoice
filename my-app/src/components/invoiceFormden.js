

// export default InvoiceForm;
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import InvoiceItem from './InvoiceItem';
import InvoiceModal from './InvoiceModal';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';

class InvoiceForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      isLoading: false,
      currency: '₹',
      currentDate: '',
      invoiceNumber: 1,
      dateOfIssue: '',
      billTo: '',
      billToEmail: '',
      billToAddress: '',
      billFrom: '',
      billFromEmail: '',
      billFromAddress: '',
      notes: '',
      PO_Number: '',
      poNumber: '',
      orgId: '',
      total: '0.00',
      subTotal: '0.00',
      taxRate: '',
      taxAmmount: '0.00',
      discountRate: '',
      discountAmmount: '0.00',
      net_amount: '0.00',
      items: [
        {
          id: 0,
          name: '',
          description: '',
          price: '1.00',
          itemPO: '',
          quantity: 1
        }
      ]
    };
    this.editField = this.editField.bind(this);
  }

  componentDidMount() {
    this.handleCalculateTotal();
  }

  fetchPOData = async () => {
    const { orgId, poNumber } = this.state;
    if (!orgId || !poNumber) return;

    this.setState({ isLoading: true });
    try {
      const response = await fetch(
        `https://api.hyperbots.com/data_hub/${orgId}/purchase_order/v1/order-number`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJraWQiOiJrZXktaWQiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxOTk1ODM1OC1kNWRjLTRkYzMtYmJlNy0xZjg4OTk3ZWUyNmMiLCJvcmdfaWQiOiJkYTI5NTkyOC1hMTQ3LTRmNGQtYWJmYy05ZGUzODU5ODVkMjMiLCJleHAiOjE3NDA3Mzc4ODUsImlhdCI6MTc0MDczNDI4NX0.CytNl4Am2X8BgwEJEWrFbF3q14iFoMHCeQ24-rTpvrZQvrIHp456Nw75o2FKWItCdsY3KXR1OxvPdQorqqTvj60o7oTd1O7ty1ovVDYJcXmkwGSZQNmsAtEiEpvvmrHDnmO0caiRJCx2RV1Ci0gstBryTIsaV2KgPxiFg3nSzwM',
            'accept': 'application/json'
          },
          body: JSON.stringify([poNumber])
        }
      );

      const data = await response.json();
      const poData = data[0];

      this.setState({
        billTo: poData.ship_to_contact_person,
        billToAddress: `${poData.ship_to_address_line_1}, ${poData.ship_to_city}, ${poData.ship_to_country}, ${poData.ship_to_postal_code}`,
        billFrom: poData.vendor_name,
        billFromAddress: `${poData.vendor_address_line_1}, ${poData.vendor_city}, ${poData.vendor_country}, ${poData.vendor_postal_code}`,
        dateOfIssue: poData.date.split('T')[0],
        items: poData.line_items.map(item => ({
          id: (+new Date() + Math.random()).toString(36),
          name: item["line_item/description"],
          description: " ",
          price: item["line_item/unit_price"].toString(),
          quantity: item["line_item/quantity"],
          itemPO: item["line_item/parent_key"]
        })),
        taxRate: poData.tax_rate.toString(),
        discountRate: poData.discount_percent?.toString() || '0',
        notes: poData.payment_terms_key.toString()
      }, () => this.handleCalculateTotal());

    } catch (error) {
      console.error('Error fetching PO data:', error);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleRowDel = (item) => {
    this.setState(prevState => ({
      items: prevState.items.filter(i => i.id !== item.id)
    }), this.handleCalculateTotal);
  };

  handleAddEvent = () => {
    const id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
    const newItem = {
      id,
      name: '',
      description: '',
      price: '1.00',
      itemPO: '',
      quantity: 1
    };
    
    this.setState(prevState => ({
      items: [...prevState.items, newItem]
    }), this.handleCalculateTotal);
  };

  handleCalculateTotal = () => {
    const subTotal = this.state.items.reduce((acc, item) => {
      const itemTotal = parseFloat(item.price) * parseFloat(item.quantity);
      return acc + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);

    const taxAmmount = (subTotal * (this.state.taxRate / 100)).toFixed(2);
    const discountAmmount = (subTotal * (this.state.discountRate / 100)).toFixed(2);
    const netAmount = parseFloat(this.state.net_amount) || 0;

    const total = (
      subTotal +
      parseFloat(taxAmmount) -
      parseFloat(discountAmmount) +
      netAmount
    ).toFixed(2);

    this.setState({
      subTotal: subTotal.toFixed(2),
      taxAmmount,
      discountAmmount,
      total
    });
  };

  onItemizedItemEdit = (evt) => {
    const item = {
      id: evt.target.id,
      name: evt.target.name,
      value: evt.target.value
    };
    
    const items = this.state.items.map(existingItem => 
      existingItem.id === item.id ? {...existingItem, [item.name]: item.value} : existingItem
    );
    
    this.setState({ items }, this.handleCalculateTotal);
  };

  editField = (event) => {
    this.setState(
      { [event.target.name]: event.target.value },
      this.handleCalculateTotal
    );
  };

  openModal = (event) => {
    event.preventDefault();
    this.handleCalculateTotal();
    this.setState({ isOpen: true });
  };

  closeModal = () => this.setState({ isOpen: false });

  render() {
    return (
      <Form onSubmit={this.openModal}>
        <Row>
          <Col md={8} lg={9}>
            <Card className="p-4 p-xl-5 my-3 my-xl-4">
              <div className="d-flex flex-row align-items-start justify-content-between mb-3">
                <div className="d-flex flex-column">
                  <div className="d-flex flex-column">
                    <div className="mb-2">
                      <span className="fw-bold">Current Date: </span>
                      <span className="current-date">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex flex-row align-items-center mb-2">
                    <span className="fw-bold mb-3 me-2">Org ID:</span>
                    <Form.Control
                      type="text"
                      placeholder="Enter Org ID"
                      value={this.state.orgId}
                      name="orgId"
                      onChange={(e) => this.setState({ orgId: e.target.value })}
                      style={{ maxWidth: '250px' }}
                    />
                  </div>

                  <div className="d-flex flex-row align-items-center mb-2">
                    <span className="fw-bold mb-3 me-2">PO Number:</span>
                    <Form.Control
                      type="text"
                      placeholder="Press enter to search"
                      value={this.state.poNumber}
                      name="poNumber"
                      onChange={(e) => this.setState({ poNumber: e.target.value })}
                      onBlur={this.fetchPOData}
                      style={{ maxWidth: '250px' }}
                    />
                    {this.state.isLoading && (
                      <Spinner animation="border" size="sm" className="ms-2" />
                    )}
                  </div>

                  <div className="d-flex flex-row align-items-center me-3 mb-2">
                    <span className="fw-bold d-block ">Due&nbsp;Date:</span>
                    <Form.Control
                      type="text"
                      value={this.state.dateOfIssue}
                      name={"dateOfIssue"}
                      onChange={(event) => this.editField(event)}
                      style={{ maxWidth: '150px' }}
                    />
                  </div>
                </div>
                <div className="d-flex flex-row align-items-center">
                  <span className="fw-bold me-2">Invoice Number: </span>
                  <Form.Control
                    type="number"
                    value={this.state.invoiceNumber}
                    name="invoiceNumber"
                    onChange={this.editField}
                    min="1"
                    style={{ maxWidth: '70px' }}
                    required
                  />
                </div>
              </div>
              <hr className="my-4" />
              <Row className="mb-5">
                <Col>
                  <Form.Label className="fw-bold">Bill to:</Form.Label>
                  <Form.Control
                    placeholder="Who is this invoice to?"
                    value={this.state.billTo}
                    name="billTo"
                    onChange={this.editField}
                    className="my-2"
                    required
                  />
                  {/* <Form.Control
                    placeholder="Email address"
                    value={this.state.billToEmail}
                    name="billToEmail"
                    onChange={this.editField}
                    className="my-2"
                    type="email"
                    required
                  /> */}
                  <Form.Control
                    placeholder="Billing address"
                    value={this.state.billToAddress}
                    name="billToAddress"
                    onChange={this.editField}
                    className="my-2"
                    required
                  />
                </Col>
                <Col>
                  <Form.Label className="fw-bold">Bill from:</Form.Label>
                  <Form.Control
                    placeholder="Who is this invoice from?"
                    value={this.state.billFrom}
                    name="billFrom"
                    onChange={this.editField}
                    className="my-2"
                    required
                  />
                  {/* <Form.Control
                    placeholder="Email address"
                    value={this.state.billFromEmail}
                    name="billFromEmail"
                    onChange={this.editField}
                    className="my-2"
                    type="email"
                    required
                  /> */}
                  <Form.Control
                    placeholder="Billing address"
                    value={this.state.billFromAddress}
                    name="billFromAddress"
                    onChange={this.editField}
                    className="my-2"
                    required
                  />
                </Col>
              </Row>
              <InvoiceItem
                onItemizedItemEdit={this.onItemizedItemEdit}
                onRowAdd={this.handleAddEvent}
                onRowDel={this.handleRowDel}
                currency={this.state.currency}
                items={this.state.items}
              />
              <Row className="mt-4 justify-content-end">
                <Col lg={6}>
                  <div className="d-flex flex-row align-items-start justify-content-between">
                    <span className="fw-bold">Net Amount:</span>
                    <InputGroup className="ms-2" style={{ maxWidth: '150px' }}>
                      <InputGroup.Text>{this.state.currency}</InputGroup.Text>
                      <Form.Control
                        type="number"
                        value={this.state.net_amount}
                        name="net_amount"
                        onChange={this.editField}
                        step="0.01"
                      />
                    </InputGroup>
                  </div>
                  <div className="d-flex flex-row align-items-start justify-content-between">
                    <span className="fw-bold">Subtotal:</span>
                    <span>
                      {this.state.currency}
                      {this.state.subTotal}
                    </span>
                  </div>
                  <div className="d-flex flex-row align-items-start justify-content-between mt-2">
                    <span className="fw-bold">Discount:</span>
                    <span>
                      ({this.state.discountRate || 0}%) {this.state.currency}
                      {this.state.discountAmmount || 0}
                    </span>
                  </div>
                  <div className="d-flex flex-row align-items-start justify-content-between mt-2">
                    <span className="fw-bold">Tax:</span>
                    <span>
                      ({this.state.taxRate || 0}%) {this.state.currency}
                      {this.state.taxAmmount || 0}
                    </span>
                  </div>
                  <hr />
                  <div className="d-flex flex-row align-items-start justify-content-between fw-bold fs-5">
                    <span>Total:</span>
                    <span>
                      {this.state.currency}
                      {this.state.total || 0}
                    </span>
                  </div>
                </Col>
              </Row>
              <hr className="my-4" />
              <Form.Label className="fw-bold">Notes:</Form.Label>
              <Form.Control
                placeholder="Thanks for your business!"
                name="notes"
                value={this.state.notes}
                onChange={this.editField}
                as="textarea"
                className="my-2"
                rows={1}
              />
              <Form.Label className="fw-bold">PO Number:</Form.Label>
              <Form.Control 
                placeholder="Enter PO Number if available"
                name="PO_Number"
                value={this.state.PO_Number}
                onChange={this.editField}
                className="my-2"
                rows={1}
              />
            </Card>
          </Col>
          <Col md={4} lg={3}>
            <div className="sticky-top pt-md-3 pt-xl-4">
              <Button variant="primary" type="submit" className="d-block w-100">
                Review Invoice
              </Button>
              <InvoiceModal
                showModal={this.state.isOpen}
                closeModal={this.closeModal}
                info={this.state}
                items={this.state.items}
                currency={this.state.currency}
                subTotal={this.state.subTotal}
                taxAmmount={this.state.taxAmmount}
                discountAmmount={this.state.discountAmmount}
                net_amount={this.state.net_amount}
                total={this.state.total}
              />
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Currency:</Form.Label>
                <Form.Select
                  value={this.state.currency}
                  onChange={e => this.setState({ currency: e.target.value })}
                  className="btn btn-light my-1"
                >
                  <option value="$">USD ($)</option>
                  <option value="£">GBP (£)</option>
                  <option value="¥">JPY (¥)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="SGD">SGD ($)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="₿">BTC (₿)</option>
                  <option value="TND">TND (TND)</option>
                  <option value="د.ت">TND (د.ت)</option>
                  <option value="د. إ">AED (د. إ)</option>
                  <option value="AED">AED (AED)</option>
                  <option value="₹">INR (₹)</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="my-3">
                <Form.Label className="fw-bold">Tax rate:</Form.Label>
                <InputGroup>
                  <Form.Control
                    name="taxRate"
                    type="number"
                    value={this.state.taxRate}
                    onChange={this.editField}
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                  />
                  <InputGroup.Text>%</InputGroup.Text>
                </InputGroup>
              </Form.Group>
              <Form.Group className="my-3">
                <Form.Label className="fw-bold">Discount rate:</Form.Label>
                <InputGroup>
                  <Form.Control
                    name="discountRate"
                    type="number"
                    value={this.state.discountRate}
                    onChange={this.editField}
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                  />
                  <InputGroup.Text>%</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </div>
          </Col>
        </Row>
      </Form>
    );
  }
}

export default InvoiceForm;
